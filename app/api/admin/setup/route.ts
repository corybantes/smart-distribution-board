import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Shared verification helper
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
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) return NextResponse.json({ error }, { status });

  try {
    const { mode, outlets, smartDbId } = await request.json();

    if (!mode) {
      return NextResponse.json({ error: "Mode is required" }, { status: 400 });
    }

    // 1. Verify the user is actually an admin
    const adminRef = adminDb.collection("users").doc(uid);
    const adminSnap = await adminRef.get();

    if (adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Update the Admin's Document securely
    await adminRef.set(
      {
        systemMode: mode,
        outletsConfig: mode === "multi" ? outlets : [],
        isConfigured: true,
      },
      { merge: true },
    );

    // 3. Generate Tenant Invites (Only if Multi-User)
    if (mode === "multi" && Array.isArray(outlets)) {
      // Use a batch to write all invites efficiently
      const batch = adminDb.batch();

      for (const outlet of outlets) {
        if (outlet.email && outlet.email.trim() !== "") {
          const cleanEmail = outlet.email.trim().toLowerCase();
          const inviteRef = adminDb.collection("users").doc(cleanEmail);

          batch.set(
            inviteRef,
            {
              adminId: uid,
              smartDbId: smartDbId,
              outletId: outlet.id.toString(),
              assignedLabel: outlet.label,
              role: "tenant",
              inviteStatus: "pending",
            },
            { merge: true },
          ); // Merge prevents overwriting an existing user
        }
      }

      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Setup API Error:", err);
    return NextResponse.json(
      { error: "Failed to configure system", details: err.message },
      { status: 500 },
    );
  }
}
