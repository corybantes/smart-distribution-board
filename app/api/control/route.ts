import { NextResponse } from "next/server";
import { adminRtdb, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, smartDbId, outletId, action } = body; // action: "ON" or "OFF"

    if (!uid || !smartDbId || !outletId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // 1. Verify User Permission (Optional but recommended)
    // Check if requester is Admin or the Tenant assigned to this outlet
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const role = userDoc.data()?.role;

    // If tenant, verify they own this outlet
    if (role === "tenant" && userDoc.data()?.outletId !== outletId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Determine State Value (Assuming 1 = ON, 0 = OFF)
    const statusValue = action === "ON" ? 1 : 0;

    // 3. Write to Realtime Database
    // Path: Devices/ESP_{id}/Control/O{id}
    // (Ensure your ESP32 is listening to this path!)
    const controlPath = `Devices/ESP_${smartDbId}/Control/O${outletId}`;

    await adminRtdb.ref(controlPath).set(statusValue);

    return NextResponse.json({
      success: true,
      message: `Outlet ${outletId} turned ${action}`,
    });
  } catch (error: any) {
    console.error("Control Error:", error);
    return NextResponse.json({ error: "Command failed" }, { status: 500 });
  }
}
