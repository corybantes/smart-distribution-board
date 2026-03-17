import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Helper function to verify the token and get the UID
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization header", status: 401 };
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Optional but highly recommended: Verify they are actually an admin in the database
    const userDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    if (userDoc.data()?.role !== "admin") {
      return { error: "Unauthorized: Admins only", status: 403 };
    }

    return { uid: decodedToken.uid, status: 200 };
  } catch (error) {
    return { error: "Invalid or expired token", status: 401 };
  }
}

export async function GET(request: Request) {
  // 1. Authenticate the request
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  // 2. Safely use the UID extracted from the secure token, NOT the query params
  const uid = authResult.uid as string;

  try {
    const docSnap = await adminDb.collection("config").doc(uid).get();
    const data = docSnap.exists
      ? docSnap.data()
      : {
          mode: "multi",
          globalBillingEnabled: true,
          maxLoadLimit: 5000,
          buzzerEnabled: true,
          pricePerKwh: 206.8, // Default Price
        };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  // 1. Authenticate the request
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const uid = authResult.uid as string;

  try {
    const body = await request.json();

    // 2. Sanitize the input to prevent malicious field injection
    const allowedFields = [
      "mode",
      "globalBillingEnabled",
      "maxLoadLimit",
      "buzzerEnabled",
      "pricePerKwh",
    ];
    const sanitizedSettings: any = {};

    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        sanitizedSettings[key] = body[key];
      }
    }

    // 3. Update using the secure UID
    await adminDb
      .collection("config")
      .doc(uid)
      .set(sanitizedSettings, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
