import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  // Date Filters
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Pagination Parameters
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const offset = (page - 1) * limit;

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Get Wallet Balance (Separate simple fetch)
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const balance = userDoc.exists ? userDoc.data()?.balance || 0 : 0;

    // 2. Build the Base Query
    let query = adminDb
      .collection("billing")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc");

    // Apply Date Filters
    if (startDate) {
      query = query.where(
        "createdAt",
        ">=",
        Timestamp.fromDate(new Date(startDate))
      );
    }
    if (endDate) {
      query = query.where(
        "createdAt",
        "<=",
        Timestamp.fromDate(new Date(endDate))
      );
    }

    // 3. Get Total Count (Efficient Aggregation)
    // We need this to calculate 'totalPages' for the UI
    const countSnapshot = await query.count().get();
    const totalRecords = countSnapshot.data().count;
    const totalPages = Math.ceil(totalRecords / limit);

    // 4. Execute Paginated Query using Offset
    // Note: 'offset' works well in Admin SDK for moderate dataset sizes
    const snapshot = await query.limit(limit).offset(offset).get();

    // 5. Map Data
    const history = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Safety check for dates
      let dateStr = "Pending";
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          dateStr = data.createdAt.toDate().toLocaleDateString();
        } else {
          dateStr = new Date(data.createdAt).toLocaleDateString();
        }
      }

      return {
        id: doc.id,
        ...data,
        date: dateStr,
      };
    });

    // 6. Return Data + Pagination Meta
    return NextResponse.json({
      balance,
      history,
      meta: {
        total: totalRecords,
        page: page,
        limit: limit,
        totalPages: totalPages,
      },
    });
  } catch (error: any) {
    console.error("Billing API Error:", error);
    return NextResponse.json(
      { error: "Fetch failed", details: error.message },
      { status: 500 }
    );
  }
}

// POST remains the same (Top Up Logic)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, amount, outletId } = body;

    await adminDb.collection("billing").add({
      userId: uid,
      outletId: outletId || "wallet",
      amount: Number(amount),
      status: "Paid",
      type: "credit",
      createdAt: FieldValue.serverTimestamp(),
    });

    await adminDb
      .collection("users")
      .doc(uid)
      .update({
        balance: FieldValue.increment(Number(amount)),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
