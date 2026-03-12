import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "UID required" }, { status: 400 });
  }

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // 1. If the user is an Admin, grab their configured outlets
    if (userData?.role === "admin") {
      const outlets = userData.outletsConfig || [];

      // Format the output so the frontend components (like the Top-Up dropdown)
      // get exactly the 'id' and 'name' properties they expect.
      const formattedOutlets = outlets.map((o: any) => ({
        id: o.id.toString(),
        name: o.label || `Outlet ${o.id}`,
        assignedEmail: o.email || null,
      }));

      return NextResponse.json(formattedOutlets);
    }

    // 2. If the user is a Tenant, they shouldn't be fetching the master outlet list anyway
    return NextResponse.json([], { status: 403 });
  } catch (error: any) {
    console.error("Outlets API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outlets", details: error.message },
      { status: 500 },
    );
  }
}
