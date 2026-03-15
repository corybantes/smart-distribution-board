import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminRtdb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  // 1. Security check (Activated for cron-job.org)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Fetch Global Config (To convert kWh to Naira)
    const configSnap = await adminDb.collection("config").doc("global").get();
    const pricePerKwh = configSnap.exists
      ? configSnap.data()?.pricePerKwh || 206.8
      : 206.8;

    // 3. Determine the exact start and end of the PREVIOUS month
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const endOfLastMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
    const startOfLastMonth = new Date(
      endOfLastMonth.getFullYear(),
      endOfLastMonth.getMonth(),
      1,
    );

    const startTs = Math.floor(startOfLastMonth.getTime() / 1000);
    const endTs = Math.floor(endOfLastMonth.getTime() / 1000);
    const monthLabel = startOfLastMonth.toISOString().substring(0, 7); // e.g., "2026-02"

    // 4. Get all Tenants from Firestore
    const usersSnap = await adminDb
      .collection("users")
      .where("role", "==", "tenant")
      .where("outletId", "!=", null)
      .get();

    let processedCount = 0;
    const dbUpdates = []; // Use Promise.all for faster execution

    for (const doc of usersSnap.docs) {
      const userData = doc.data();
      const uid = doc.id;
      const { smartDbId, outletId } = userData;

      if (!smartDbId || !outletId) continue;

      // 5. Query the RTDB for this specific month's data
      const historyRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);
      const snapshot = await historyRef
        .orderByChild("timestamp")
        .startAt(startTs)
        .endAt(endTs)
        .get();

      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const dataPoints = Object.values(rawData).sort(
          (a: any, b: any) => a.timestamp - b.timestamp,
        ) as any[];

        // 6. Calculate Total Energy for the Month
        let firstE = -1;
        let lastE = 0;

        for (const entry of dataPoints) {
          const o = entry[`O${outletId}`];
          if (o && o.E !== undefined) {
            if (firstE === -1) firstE = Number(o.E);
            lastE = Number(o.E);
          }
        }

        const monthlyUsageKwh = firstE !== -1 ? Math.max(0, lastE - firstE) : 0;

        // Calculate the actual Naira cost for the month
        const monthlyCost = monthlyUsageKwh * pricePerKwh;

        if (monthlyCost > 0) {
          // A. Save to Subcollection (For Detailed UI Tables)
          const subcollectionUpdate = adminDb
            .collection("users")
            .doc(uid)
            .collection("billingHistory")
            .doc(monthLabel)
            .set({
              month: monthLabel,
              kwhUsed: parseFloat(monthlyUsageKwh.toFixed(4)),
              amount: parseFloat(monthlyCost.toFixed(2)),
              timestamp: FieldValue.serverTimestamp(),
            });
          dbUpdates.push(subcollectionUpdate);

          // B. Update the User's Main Document with the `historicalBills` array
          // We keep only the last 6 months to ensure the array never gets too large
          let currentHistory = userData.historicalBills || [];
          currentHistory.push(parseFloat(monthlyCost.toFixed(2)));

          if (currentHistory.length > 6) {
            currentHistory = currentHistory.slice(-6); // Keep only the newest 6
          }

          const userDocUpdate = adminDb.collection("users").doc(uid).update({
            historicalBills: currentHistory,
          });
          dbUpdates.push(userDocUpdate);

          processedCount++;
        }
      }
    }

    // Execute all database writes concurrently
    await Promise.all(dbUpdates);

    return NextResponse.json({
      success: true,
      message: `Monthly snapshot completed. Processed ${processedCount} tenants for ${monthLabel}.`,
    });
  } catch (error: any) {
    console.error("Monthly Snapshot Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
