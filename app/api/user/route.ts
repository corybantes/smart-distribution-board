import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

// GET: Fetch User Profile
export async function GET(request: Request) {
  // 1. Authenticate the request securely
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) {
    return NextResponse.json({ error }, { status });
  }

  // We completely ignore searchParams.get("uid") now!

  try {
    // 2. Fetch using the Admin SDK securely
    const userSnap = await adminDb.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userSnap.data());
  } catch (error) {
    console.error("User API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PUT: Update User Profile (Onboarding)
export async function PUT(request: Request) {
  // 1. Authenticate the request securely
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const body = await request.json();

    // 2. SANITIZE INPUTS: Strictly define what fields a user is allowed to update
    // We intentionally exclude 'role', 'balance', 'historicalBills', 'smartDbId', etc.
    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "country",
      "city",
      "address",
      "onboarded",
    ];

    const safeUpdateData: Record<string, any> = {};

    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        safeUpdateData[key] = body[key];
      }
    }

    // 3. Add the server timestamp
    safeUpdateData.updatedAt = FieldValue.serverTimestamp();

    // 4. Perform the update securely using the verified UID
    await adminDb
      .collection("users")
      .doc(uid)
      .set(safeUpdateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 },
    );
  }
}
