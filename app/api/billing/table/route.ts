import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  // Date Filters & Pagination
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const offset = (page - 1) * limit;

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Check User Role
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    let query;

    // 2. Build the Base Query Dynamically
    if (userData?.role === "admin" && userData?.systemMode === "multi") {
      // LANDLORD MODE: Find all tenants belonging to this admin
      const tenantsSnap = await adminDb
        .collection("users")
        .where("adminId", "==", uid)
        .get();
      const tenantUids = tenantsSnap.docs.map((doc) => doc.id);

      if (tenantUids.length === 0) {
        // If they have no tenants yet, return an empty table
        return NextResponse.json({
          data: [],
          meta: { total: 0, page, limit, totalPages: 1 },
        });
      }

      // Fetch billing records for ALL their tenants
      query = adminDb
        .collection("billing")
        .where("userId", "in", tenantUids)
        .orderBy("createdAt", "desc");
    } else {
      // TENANT OR SINGLE-USER MODE: Fetch only their own records
      query = adminDb
        .collection("billing")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc");
    }

    // Apply Date Filters
    if (startDate) {
      query = query.where(
        "createdAt",
        ">=",
        Timestamp.fromDate(new Date(startDate)),
      );
    }
    if (endDate) {
      query = query.where(
        "createdAt",
        "<=",
        Timestamp.fromDate(new Date(endDate)),
      );
    }

    // 3. Get Total Count (Efficient Aggregation)
    const countSnapshot = await query.count().get();
    const totalRecords = countSnapshot.data().count;
    const totalPages = Math.ceil(totalRecords / limit);

    // 4. Execute Paginated Query using Offset
    const snapshot = await query.limit(limit).offset(offset).get();

    // 5. Map Data
    const history = snapshot.docs.map((doc) => {
      const data = doc.data();
      let dateStr = "Pending";
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          dateStr = data.createdAt.toDate().toLocaleDateString();
        } else {
          dateStr = new Date(data.createdAt).toLocaleDateString();
        }
      }
      return { id: doc.id, ...data, date: dateStr };
    });

    return NextResponse.json({
      data: history,
      meta: { total: totalRecords, page, limit, totalPages },
    });
  } catch (error: any) {
    console.error("Billing Table API Error:", error);
    return NextResponse.json(
      { error: "Fetch failed", details: error.message },
      { status: 500 },
    );
  }
}
