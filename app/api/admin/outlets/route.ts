import { NextResponse } from "next/server";
import { adminDb, adminAuth, adminRtdb } from "@/lib/firebase-admin"; // Added adminRtdb!

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

// ==========================================
// GET: Fetch all outlets for the Admin
// ==========================================
export async function GET(request: Request) {
  const { uid, error, status } = await verifyAuth(request);

  if (error || !uid) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // Strict Role-Based Access Control (RBAC)
    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admins only" },
        { status: 403 },
      );
    }

    const outletsConfig = userData.outletsConfig || [];
    const smartDbId = userData.smartDbId;

    let tenantsData: any[] = [];

    // Fetch LIVE tenant documents to get their current wallet balances
    if (smartDbId) {
      const tenantsSnap = await adminDb
        .collection("users")
        .where("role", "==", "tenant")
        .where("smartDbId", "==", smartDbId)
        .get();

      tenantsData = tenantsSnap.docs.map((doc) => doc.data());
    }

    // Merge the live tenant data with the Admin's outlet configuration
    const formattedOutlets = outletsConfig.map((o: any) => {
      const activeTenant = tenantsData.find(
        (t) => String(t.outletId) === String(o.id),
      );

      return {
        id: o.id.toString(),
        name: o.label || o.name || `Outlet ${o.id}`,
        assignedEmail: o.email || o.assignedEmail || null,
        priority: o.priority || 0,
        status: o.status || "active",
        tenantName: activeTenant
          ? `${activeTenant.firstName || ""} ${activeTenant.lastName || ""}`.trim()
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

// ==========================================
// POST: Add a brand new outlet channel
// ==========================================
export async function POST(request: Request) {
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentOutlets = userDoc.data()?.outletsConfig || [];

    // Check if channel ID already exists
    if (currentOutlets.some((o: any) => String(o.id) === String(body.id))) {
      return NextResponse.json(
        { error: "Channel ID already exists" },
        { status: 400 },
      );
    }

    const newOutlet = {
      id: body.id,
      name: body.name,
      assignedEmail: body.assignedEmail,
      priority: body.priority,
      status: body.status,
    };

    currentOutlets.push(newOutlet);
    await userRef.update({ outletsConfig: currentOutlets });

    return NextResponse.json({ success: true, outlet: newOutlet });
  } catch (err: any) {
    console.error("POST Outlet Error:", err);
    return NextResponse.json(
      { error: "Failed to add outlet" },
      { status: 500 },
    );
  }
}

// ==========================================
// PUT: Update an existing outlet (The Fix!)
// ==========================================
export async function PUT(request: Request) {
  const { uid, error, status } = await verifyAuth(request);
  if (error || !uid) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentOutlets = userData?.outletsConfig || [];
    const smartDbId = userData?.smartDbId;

    // Find and update the specific outlet array item
    const updatedOutlets = currentOutlets.map((outlet: any) => {
      if (String(outlet.id) === String(body.id)) {
        return { ...outlet, ...body };
      }
      return outlet;
    });

    // 1. Save to Firestore (The Ledger)
    await userRef.update({ outletsConfig: updatedOutlets });

    // 2. CRITICAL SYNC: Update Realtime Database to fix the Split-Brain Bug
    if (body.status !== undefined && smartDbId) {
      const controlPath = `Devices/ESP_${smartDbId}/Control/O${body.id}`;

      if (body.status === "inactive") {
        await adminRtdb.ref(controlPath).set(0); // Force power OFF instantly
      } else if (body.status === "active") {
        await adminRtdb.ref(controlPath).set(1); // Restore power instantly
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT Outlet Error:", err);
    return NextResponse.json(
      { error: "Failed to update outlet" },
      { status: 500 },
    );
  }
}
