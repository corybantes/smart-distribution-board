import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET: List Outlets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid"); // Admin ID
  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    const snapshot = await adminDb
      .collection("outlets")
      .where("adminId", "==", uid)
      .get();
    const outlets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(outlets);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// POST: Add New Outlet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body; // ID is the MAC/DeviceID

    await adminDb
      .collection("outlets")
      .doc(id)
      .set({
        ...data,
        billingEnabled: false,
        unitLimit: 0,
        currentUsage: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}

// PUT: Update Outlet (Priority, Limit)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await adminDb.collection("outlets").doc(id).update(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
