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
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    let query;

    if (userData?.role === "admin" && userData?.systemMode === "multi") {
      // LANDLORD MODE: Find all tenants belonging to this admin
      const tenantsSnap = await adminDb
        .collection("users")
        .where("adminId", "==", uid)
        .get();
      const tenantUids = tenantsSnap.docs.map((doc) => doc.id);

      if (tenantUids.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { total: 0, page, limit, totalPages: 1 },
        });
      }

      query = adminDb
        .collection("billing")
        .where("userId", "in", tenantUids)
        .orderBy("createdAt", "desc");
    } else {
      // TENANT OR SINGLE-USER MODE
      query = adminDb
        .collection("billing")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc");
    }

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

    const countSnapshot = await query.count().get();
    const totalRecords = countSnapshot.data().count;
    const totalPages = Math.ceil(totalRecords / limit);

    const snapshot = await query.limit(limit).offset(offset).get();

    // 5. Map Data AND Fetch User Details (Outlet ID & Name)
    const historyPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let dateStr = "Pending";

      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          dateStr = data.createdAt.toDate().toISOString(); // Better for your frontend formatter
        } else {
          dateStr = new Date(data.createdAt).toISOString();
        }
      }

      // FIX: Fetch the specific user to get their Outlet ID
      let outletId = null;
      let userName = "User";

      try {
        const uDoc = await adminDb.collection("users").doc(data.userId).get();
        if (uDoc.exists) {
          outletId = uDoc.data()?.outletId || null;
          userName = uDoc.data()?.firstName || "User";
        }
      } catch (err) {
        console.error("Failed to fetch user for billing row", err);
      }

      return {
        id: doc.id,
        ...data,
        date: dateStr,
        outletId: outletId, // Attach the outlet ID
        userName: userName, // Attach the user's name (helpful for admins!)
      };
    });

    const history = await Promise.all(historyPromises);

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
