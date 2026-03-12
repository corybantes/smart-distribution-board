import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminRtdb } from "@/lib/firebase-admin";
import { triggerAlert } from "@/lib/notify";

export async function GET(request: Request) {
  // 1. Security Check (Uncomment for production before deploying to Vercel)
  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    const configSnap = await adminDb.collection("config").doc("global").get();
    const pricePerKwh = configSnap.exists
      ? configSnap.data()?.pricePerKwh || 206.8
      : 206.8;

    const tenantsSnap = await adminDb
      .collection("users")
      .where("role", "==", "tenant")
      .where("outletId", "!=", null)
      .get();

    const results = [];
    const dbUpdates = [];

    for (const doc of tenantsSnap.docs) {
      try {
        const user = doc.data();
        const uid = doc.id;
        const { smartDbId, outletId, email } = user;
        let balance = user.balance || 0;

        const isFirstRun = user.lastRecordedKwh === undefined;
        const lastKwh = user.lastRecordedKwh || 0;

        if (!smartDbId || !outletId) continue;

        // A. Get LIVE Sensor Data
        const deviceRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);
        const snapshot = await deviceRef
          .orderByChild("timestamp")
          .limitToLast(1)
          .get();

        if (!snapshot.exists()) continue;

        const rawVal = snapshot.val();
        const latestKey = Object.keys(rawVal)[0];
        const latestData = rawVal[latestKey];

        const outletData = latestData[`O${outletId}`];
        const currentTotalKwh = Number(outletData?.E || 0);

        // Extract Hardware Metrics
        const boardTemp = Number(latestData.Temperature || 0);
        const currentPower = Number(outletData?.P || 0);

        // B. Calculate Cost Delta
        let cost = 0;
        let kwhDiff = 0;

        if (!isFirstRun && currentTotalKwh > lastKwh) {
          kwhDiff = currentTotalKwh - lastKwh;
          cost = kwhDiff * pricePerKwh;
        }

        const updateData: any = {};
        let needsDbUpdate = false;

        // C. Update Wallet & Billing Ledger
        if (cost > 0 || isFirstRun) {
          if (cost > 0) balance -= cost;

          updateData.balance = parseFloat(balance.toFixed(4));
          updateData.lastRecordedKwh = currentTotalKwh;
          needsDbUpdate = true;

          const currentUnbilled = user.unbilledAmount || 0;
          const newUnbilled = currentUnbilled + cost;

          if (newUnbilled >= 10) {
            dbUpdates.push(
              adminDb.collection("billing").add({
                userId: uid,
                amount: -parseFloat(newUnbilled.toFixed(2)),
                type: "usage",
                kwhUsed: parseFloat((newUnbilled / pricePerKwh).toFixed(4)),
                createdAt: FieldValue.serverTimestamp(),
                status: "Deducted",
              }),
            );
            updateData.unbilledAmount = 0;
          } else {
            updateData.unbilledAmount = newUnbilled;
          }
        }

        // D. UNIFIED RELAY STATE AND ALERT LOGIC
        const controlPath = `Devices/ESP_${smartDbId}/Control/O${outletId}`;
        let shouldBeOn = true;
        let cutoffReason = "";

        // Rule 1: Wallet Balance
        if (balance <= 0) {
          shouldBeOn = false;
          cutoffReason = "Zero Balance";

          if (!user.exhaustedNotified) {
            await triggerAlert(
              uid,
              email,
              "Power Disconnected",
              "Your wallet balance has been completely exhausted. Please top up your account to restore power.",
              "error",
            );
            updateData.exhaustedNotified = true;
            needsDbUpdate = true;
          }
        } else {
          if (user.exhaustedNotified) {
            updateData.exhaustedNotified = false;
            needsDbUpdate = true;
          }
          if (balance <= 1000 && !user.lowBalanceNotified) {
            await triggerAlert(
              uid,
              email,
              "Low Balance Warning",
              `Your SmartDB wallet is running low (₦${balance.toFixed(2)} remaining). Please top up soon to avoid power disconnection.`,
              "warning",
            );
            updateData.lowBalanceNotified = true;
            needsDbUpdate = true;
          } else if (balance > 1000 && user.lowBalanceNotified) {
            updateData.lowBalanceNotified = false;
            needsDbUpdate = true;
          }
        }

        // Rule 2: Thermal Safety (50°C Limit)
        if (boardTemp >= 50) {
          shouldBeOn = false;
          cutoffReason = "Thermal Limit Exceeded";

          if (!user.thermalNotified) {
            await triggerAlert(
              uid,
              email,
              "Critical Thermal Event",
              `The distribution board has exceeded 50°C (Current: ${boardTemp}°C). Power has been isolated to prevent fire hazards.`,
              "error",
            );
            updateData.thermalNotified = true;
            needsDbUpdate = true;
          }
        } else if (boardTemp <= 45 && user.thermalNotified) {
          // Reset when board cools down below 45°C
          updateData.thermalNotified = false;
          needsDbUpdate = true;
        }

        // Rule 3: Sub-Circuit Overload (2500W Limit)
        if (currentPower > 2500) {
          shouldBeOn = false;
          cutoffReason = "Overload Limit Exceeded";

          if (!user.overloadNotified) {
            await triggerAlert(
              uid,
              email,
              "Overload Detected",
              `Your sub-circuit exceeded the 2500W safety limit (Current: ${currentPower}W). Power has been automatically cut. Please turn off heavy appliances.`,
              "warning",
            );
            updateData.overloadNotified = true;
            needsDbUpdate = true;
          }
        } else if (currentPower <= 2000 && user.overloadNotified) {
          // Reset when power load drops back to a safe baseline
          updateData.overloadNotified = false;
          needsDbUpdate = true;
        }

        // E. Execute Physical Control
        if (!shouldBeOn) {
          await adminRtdb.ref(controlPath).set(0);
          results.push({
            uid,
            status: `CUTOFF (${cutoffReason})`,
            balance: parseFloat(balance.toFixed(2)),
          });
        } else {
          // All 3 rules passed (Balance > 0, Temp < 50, Power <= 2500)
          await adminRtdb.ref(controlPath).set(1);
          results.push({
            uid,
            status: "ACTIVE",
            balance: parseFloat(balance.toFixed(2)),
          });
        }

        // Queue DB Update
        if (needsDbUpdate) {
          dbUpdates.push(
            adminDb.collection("users").doc(uid).update(updateData),
          );
        }
      } catch (err) {
        console.error(`Error processing tenant ${doc.id}:`, err);
        results.push({ uid: doc.id, status: "ERROR" });
      }
    }

    // Execute all queued Firestore writes concurrently
    await Promise.all(dbUpdates);

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error("Billing Engine Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
