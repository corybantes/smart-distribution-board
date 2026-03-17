import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Helper function to verify the token and get the UID
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      uid: null,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, error: null, status: 200 };
  } catch (error) {
    return { uid: null, error: "Invalid or expired token", status: 401 };
  }
}

export async function GET(request: Request) {
  // 1. Authenticate the request securely
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) {
    return NextResponse.json({ error }, { status });
  }

  const { searchParams } = new URL(request.url);

  // Date Filters & Pagination
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const offset = (page - 1) * limit;

  try {
    // 2. Use the secure UID from the token
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

      // Note: Firestore 'in' queries max out at 30 items.
      // If you anticipate more than 30 tenants per admin, you will need to chunk this array.
      query = adminDb
        .collection("billing")
        .where("userId", "in", tenantUids.slice(0, 30))
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

    // Run the count and fetch the paginated documents
    const countSnapshot = await query.count().get();
    const totalRecords = countSnapshot.data().count;
    const totalPages = Math.ceil(totalRecords / limit);

    const snapshot = await query.limit(limit).offset(offset).get();

    // 3. Performance Optimization: Cache user docs to prevent duplicate DB calls
    const userCache = new Map();

    // 4. Map Data AND Fetch User Details (Outlet ID & Name)
    const historyPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let dateStr = "Pending";

      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          dateStr = data.createdAt.toDate().toISOString();
        } else {
          dateStr = new Date(data.createdAt).toISOString();
        }
      }

      let outletId = null;
      let userName = "User";

      // Use the cache to look up the user details
      try {
        if (!userCache.has(data.userId)) {
          const uDoc = await adminDb.collection("users").doc(data.userId).get();
          userCache.set(data.userId, uDoc.exists ? uDoc.data() : null);
        }

        const cachedUser = userCache.get(data.userId);
        if (cachedUser) {
          outletId = cachedUser.outletId || null;
          userName = cachedUser.firstName || "User";
        }
      } catch (err) {
        console.error("Failed to fetch user for billing row", err);
      }

      return {
        id: doc.id,
        ...data,
        date: dateStr,
        outletId: outletId,
        userName: userName,
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
