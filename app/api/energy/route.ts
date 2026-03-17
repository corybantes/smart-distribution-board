import { NextResponse } from "next/server";
import { adminDb, adminRtdb, adminAuth } from "@/lib/firebase-admin";

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
    // 2. Get User Profile from Firestore to find the SmartDB ID
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const smartDbId = userData?.smartDbId; // e.g., "BOARD_001"
    const role = userData?.role; // "admin" or "tenant"

    // For tenants, we need their specific outlet ID
    const tenantOutletId = userData?.outletId;

    if (!smartDbId) {
      return NextResponse.json(
        { error: "No Smart Device linked to this account" },
        { status: 404 },
      );
    }

    // 3. Query Realtime Database
    // Path: Devices/ESP_{smartDbId}/History
    // We order by 'timestamp' and take the last 1 to get the LATEST reading
    const historyRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);
    const snapshot = await historyRef
      .orderByChild("timestamp")
      .limitToLast(1)
      .get();

    if (!snapshot.exists()) {
      return NextResponse.json({ message: "No hardware data yet" });
    }

    // 4. Extract Data
    // snapshot.val() returns an object like { "random_uuid": { ...data } }
    const rawData = snapshot.val();
    const uniqueKey = Object.keys(rawData)[0];
    const latestEntry = rawData[uniqueKey];

    // 5. Parse Outlets
    // The hardware sends the 4 RCCB channel readings as O1, O2... On.
    // We need to convert this to an array safely based on role.
    let outlets = [];

    // Helper to format a single outlet
    const formatOutlet = (key: string, data: any) => ({
      id: key.replace("O", ""), // "O1" -> "1"
      name: `Outlet ${key.replace("O", "")}`,
      voltage: data.V,
      current: data.I,
      power: data.P,
      powerFactor: data.PF,
      reactivePower: data.Q,
      status: data.S, // 0=Off, 1=On, 2=Tripped
    });

    if (role === "admin") {
      // Admin sees ALL active channels
      outlets = Object.keys(latestEntry)
        .filter(
          (key) => key.startsWith("O") && !isNaN(Number(key.substring(1))),
        )
        .map((key) => formatOutlet(key, latestEntry[key]));
    } else {
      // Tenant sees ONLY their assigned outlet
      const targetKey = `O${tenantOutletId}`;
      if (latestEntry[targetKey]) {
        outlets.push(formatOutlet(targetKey, latestEntry[targetKey]));
      }
    }

    // 6. Return Clean JSON
    return NextResponse.json({
      timestamp: latestEntry.timestamp,
      temperature: latestEntry.T,
      buzzer: latestEntry.B,
      outlets: outlets,
      deviceStatus: "online", // You can add logic to check timestamp vs Date.now() if needed
    });
  } catch (error: any) {
    console.error("Energy API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
