import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET: Fetch User Profile
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(userSnap.data());
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT: Update User Profile (Onboarding)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { uid, ...data } = body;

    if (!uid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 });
    }

    // Reference using Admin SDK
    const userRef = adminDb.collection("users").doc(uid);

    // Prepare update data
    // Note: serverTimestamp() from client SDK doesn't work here.
    // Use FieldValue.serverTimestamp() or just new Date()
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Perform the update (Bypasses rules!)
    await userRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}
