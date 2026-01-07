import { NextResponse } from "next/server";
import { adminDb, adminRtdb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Get User Profile from Firestore to find the SmartDB ID
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const smartDbId = userData?.smartDbId; // e.g., "BOARD_001"
    const role = userData?.role; // "admin" or "tenant"

    // For tenants, we need their specific outlet ID (e.g., 1, 2)
    // You must ensure this is saved in their profile during creation
    const tenantOutletId = userData?.outletId;

    if (!smartDbId) {
      return NextResponse.json(
        { error: "No Smart Device linked to this account" },
        { status: 404 }
      );
    }

    // 2. Query Realtime Database
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

    // 3. Extract Data
    // snapshot.val() returns an object like { "random_uuid": { ...data } }
    const rawData = snapshot.val();
    const uniqueKey = Object.keys(rawData)[0];
    const latestEntry = rawData[uniqueKey];

    // 4. Parse Outlets
    // The hardware sends O1, O2... On. We need to convert this to an array.
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
      // Admin sees ALL outlets (O1, O2, O3...)
      outlets = Object.keys(latestEntry)
        .filter(
          (key) => key.startsWith("O") && !isNaN(Number(key.substring(1)))
        ) // Filter only O1, O2...
        .map((key) => formatOutlet(key, latestEntry[key]));
    } else {
      // Tenant sees ONLY their assigned outlet
      const targetKey = `O${tenantOutletId}`;
      if (latestEntry[targetKey]) {
        outlets.push(formatOutlet(targetKey, latestEntry[targetKey]));
      }
    }

    // 5. Return Clean JSON
    return NextResponse.json({
      timestamp: latestEntry.timestamp,
      temperature: latestEntry.T,
      buzzer: latestEntry.B,
      outlets: outlets,
      deviceStatus: "online", // You can add logic to check timestamp vs Date.now()
    });
  } catch (error: any) {
    console.error("Energy API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
