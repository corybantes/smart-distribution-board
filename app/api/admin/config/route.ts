import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    const docSnap = await adminDb.collection("config").doc(uid).get();
    const data = docSnap.exists
      ? docSnap.data()
      : {
          mode: "multi",
          globalBillingEnabled: true,
          maxLoadLimit: 5000,
          buzzerEnabled: true,
          pricePerKwh: 100, // Default Price (e.g. Naira)
        };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}
// PUT handler remains the same (it blindly accepts fields)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { uid, ...settings } = body;
    if (!uid)
      return NextResponse.json({ error: "UID required" }, { status: 400 });

    await adminDb.collection("config").doc(uid).set(settings, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
