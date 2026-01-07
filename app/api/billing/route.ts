import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const startDate = searchParams.get("startDate"); // ISO String
  const endDate = searchParams.get("endDate"); // ISO String

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Get Balance
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const balance = userDoc.exists ? userDoc.data()?.balance || 0 : 0;

    // 2. Build Query
    let query = adminDb
      .collection("billing")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc");

    // Apply Date Filters if provided
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

    const historySnap = await query.limit(20).get();

    const history = historySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.createdAt?.toDate().toLocaleDateString() || "Pending",
      };
    });

    return NextResponse.json({ balance, history });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Fetch failed", details: error.message },
      { status: 500 }
    );
  }
}

// POST remains the same as previous (Top Up logic)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, amount, outletId } = body;

    await adminDb.collection("billing").add({
      userId: uid,
      outletId,
      amount: Number(amount),
      units: 0,
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
