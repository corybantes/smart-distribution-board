import { NextResponse } from "next/server";
import { adminRtdb, adminDb, adminAuth } from "@/lib/firebase-admin";

// Helper function to verify the token
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

export async function POST(request: Request) {
  // 1. Authenticate the request securely
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { smartDbId, outletId, action } = body; // action: "ON" or "OFF"

    if (!smartDbId || !outletId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const role = userData?.role;

    // 2. Tenant Validation & Admin Override Check
    if (role === "tenant") {
      // Security Check 1: Do they own this outlet?
      if (String(userData?.outletId) !== String(outletId)) {
        return NextResponse.json(
          { error: "Unauthorized access to this channel" },
          { status: 403 },
        );
      }

      // Security Check 2: Has the Admin locked this outlet?
      if (action === "ON" && userData?.adminId) {
        const adminDoc = await adminDb
          .collection("users")
          .doc(userData.adminId)
          .get();
        const adminOutlets = adminDoc.data()?.outletsConfig || [];
        const thisOutletConfig = adminOutlets.find(
          (o: any) => String(o.id) === String(outletId),
        );

        if (thisOutletConfig && thisOutletConfig.status === "inactive") {
          return NextResponse.json(
            {
              error:
                "Access Denied: The system administrator has disabled power to this room.",
            },
            { status: 403 },
          );
        }
      }
    }

    // 3. Determine State Value (Assuming 1 = ON, 0 = OFF)
    const statusValue = action === "ON" ? 1 : 0;

    // 4. Write to Realtime Database
    const controlPath = `Devices/ESP_${smartDbId}/Control/O${outletId}`;
    await adminRtdb.ref(controlPath).set(statusValue);

    return NextResponse.json({
      success: true,
      message: `Power turned ${action}`,
    });
  } catch (err: any) {
    console.error("Control Error:", err);
    return NextResponse.json({ error: "Command failed" }, { status: 500 });
  }
}
