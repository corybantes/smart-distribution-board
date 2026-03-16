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
      const outletsConfig = userData.outletsConfig || [];
      const smartDbId = userData.smartDbId;

      let tenantsData: any[] = [];

      // 2. Fetch the LIVE tenant documents to get their current wallet balances
      if (smartDbId) {
        const tenantsSnap = await adminDb
          .collection("users")
          .where("role", "==", "tenant")
          .where("smartDbId", "==", smartDbId)
          .get();

        tenantsData = tenantsSnap.docs.map((doc) => doc.data());
      }

      // 3. Merge the live tenant data with the Admin's outlet configuration
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
    }

    // 4. If the user is a Tenant, they shouldn't be fetching the master outlet list anyway
    return NextResponse.json([], { status: 403 });
  } catch (error: any) {
    console.error("Outlets API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outlets", details: error.message },
      { status: 500 },
    );
  }
}
