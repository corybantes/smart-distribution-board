import { NextResponse } from "next/server";
import { adminDb, adminRtdb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  // 1. Security Check (Prevent unauthorized access)
  const authHeader = request.headers.get("authorization");
  //   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //   }

  try {
    // 2. Fetch Global Config (Price per kWh)
    const configSnap = await adminDb.collection("config").doc("global").get();
    const pricePerKwh = configSnap.exists
      ? configSnap.data()?.pricePerKwh || 100
      : 100;

    // 3. Fetch Active Tenants (Only those with an assigned outlet)
    const tenantsSnap = await adminDb
      .collection("users")
      .where("role", "==", "tenant")
      .where("outletId", "!=", null)
      .get();

    const results = [];

    // 4. Process Each Tenant
    for (const doc of tenantsSnap.docs) {
      const user = doc.data();
      const uid = doc.id;
      const { smartDbId, outletId } = user;
      let balance = user.balance || 0;

      // 'lastRecordedKwh' is the meter reading we billed for last time.
      // If it doesn't exist, we set it to the current reading later (first run logic).
      let lastKwh = user.lastRecordedKwh || 0;

      if (!smartDbId || !outletId) continue;

      // A. Get LIVE Cumulative Energy (kWh) from Hardware
      // Note: Your ESP32 MUST send a total accumulated energy value (e.g., "E")
      const deviceRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);

      // Get the very latest reading
      const snapshot = await deviceRef
        .orderByChild("timestamp")
        .limitToLast(1)
        .get();

      if (!snapshot.exists()) continue;

      const rawVal = snapshot.val();
      const latestKey = Object.keys(rawVal)[0];
      const latestData = rawVal[latestKey];

      // Extract Energy for specific outlet (Assuming structure O1: { E: 120.5 ... })
      const outletData = latestData[`O${outletId}`];
      const currentTotalKwh = Number(outletData?.E || 0);

      // B. Calculate Cost
      // If lastKwh is 0 (first run), we just update the pointer without charging to avoid massive bills.
      let cost = 0;
      let kwhDiff = 0;

      if (lastKwh > 0 && currentTotalKwh > lastKwh) {
        kwhDiff = currentTotalKwh - lastKwh;
        cost = kwhDiff * pricePerKwh;
      }

      // C. Update Wallet & Database
      if (cost > 0 || lastKwh === 0) {
        if (cost > 0) balance -= cost;

        await adminDb
          .collection("users")
          .doc(uid)
          .update({
            balance: parseFloat(balance.toFixed(2)),
            lastRecordedKwh: currentTotalKwh, // Save checkpoint for next run
          });

        // Log transaction for history (Optional, keeps billing page populated)
        if (cost > 0) {
          await adminDb.collection("billing").add({
            userId: uid,
            amount: -cost, // Negative for deduction
            type: "usage",
            kwhUsed: kwhDiff,
            createdAt: new Date(), // Use server timestamp in prod
            status: "Deducted",
          });
        }
      }

      // D. CUTOFF LOGIC
      const controlPath = `Devices/ESP_${smartDbId}/Control/O${outletId}`;

      if (balance <= 0) {
        // Balance Exhausted -> Turn OFF
        await adminRtdb.ref(controlPath).set(0);
        results.push({ uid, status: "CUTOFF", balance });
      } else {
        // Balance Positive -> Ensure ON
        // (Optional: You can uncomment this if you want auto-reconnection)
        // await adminRtdb.ref(controlPath).set(1);
        results.push({ uid, status: "ACTIVE", balance });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error("Billing Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
