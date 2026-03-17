import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

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

export async function GET(request: Request) {
  // 1. Authenticate the request securely
  const { uid, error, status } = await verifyAuth(request);

  if (error || !uid) {
    return NextResponse.json({ error }, { status });
  }

  try {
    // 2. Use the verified UID from the token, NEVER from the URL query params
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // 3. Strict Role-Based Access Control (RBAC)
    if (userData?.role !== "admin") {
      // If the user is a Tenant, immediately reject. They shouldn't be fetching the master list.
      return NextResponse.json(
        { error: "Unauthorized: Admins only" },
        { status: 403 },
      );
    }

    // 4. Admin is verified. Grab their configured outlets.
    const outletsConfig = userData.outletsConfig || [];
    const smartDbId = userData.smartDbId;

    let tenantsData: any[] = [];

    // 5. Fetch the LIVE tenant documents to get their current wallet balances
    if (smartDbId) {
      const tenantsSnap = await adminDb
        .collection("users")
        .where("role", "==", "tenant")
        .where("smartDbId", "==", smartDbId)
        .get();

      tenantsData = tenantsSnap.docs.map((doc) => doc.data());
    }

    // 6. Merge the live tenant data with the Admin's outlet configuration
    const formattedOutlets = outletsConfig.map((o: any) => {
      // Find the specific tenant assigned to this outlet ID
      const activeTenant = tenantsData.find(
        (t) => String(t.outletId) === String(o.id),
      );

      return {
        id: o.id.toString(),
        name: o.label || `Outlet ${o.id}`,
        assignedEmail: o.email || null,
        // Inject the live data for the Admin Chart!
        tenantName: activeTenant
          ? `${activeTenant.firstName} ${activeTenant.lastName}`.trim()
          : null,
        tenantBalance: activeTenant ? activeTenant.balance || 0 : 0,
      };
    });

    return NextResponse.json(formattedOutlets);
  } catch (error: any) {
    console.error("Outlets API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outlets", details: error.message },
      { status: 500 },
    );
  }
}
