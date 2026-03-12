import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminRtdb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  // 1. Security check (Optional but recommended for Cron jobs)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // You can comment this out while testing locally
    // return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Determine the exact start and end of the PREVIOUS month
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

    // 3. Get all Tenants from Firestore
    const usersSnap = await adminDb
      .collection("users")
      .where("role", "==", "tenant")
      .get();

    let processedCount = 0;

    for (const doc of usersSnap.docs) {
      const userData = doc.data();
      const { smartDbId, outletId, uid } = userData;

      if (!smartDbId || !outletId) continue;

      // 4. Query the RTDB for this specific month's data
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

        // 5. Calculate Total Energy for the Month (Last Reading - First Reading)
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

        // 6. Save the Monthly Snapshot to the User's Billing History Subcollection
        if (monthlyUsageKwh > 0) {
          await adminDb
            .collection("users")
            .doc(uid)
            .collection("billingHistory")
            .doc(monthLabel) // Saves as e.g., "2026-02" so it doesn't duplicate
            .set({
              month: monthLabel,
              usage: parseFloat(monthlyUsageKwh.toFixed(4)),
              timestamp: FieldValue.serverTimestamp(),
            });

          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monthly snapshot completed. Processed ${processedCount} tenants for ${monthLabel}.`,
    });
  } catch (error: any) {
    console.error("Monthly Snapshot Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
