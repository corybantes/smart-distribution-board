import { NextResponse } from "next/server";
import { adminRtdb, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  const startTs = searchParams.get("startDate");
  const endTs = searchParams.get("endDate");
  let requestedOutletId = searchParams.get("outletId");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Authenticate & Secure the User Role
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userDoc.data()!;
    const smartDbId = userData.smartDbId;
    const role = userData.role;

    if (!smartDbId)
      return NextResponse.json({ error: "No device linked" }, { status: 404 });

    // SECURITY OVERRIDE: Prevent Tenant Data Leaks
    if (role === "tenant") {
      requestedOutletId = userData.outletId;
    }

    // 2. Define Time Range
    const now = Math.floor(Date.now() / 1000);
    const start = startTs ? parseInt(startTs) : now - 86400;
    const end = endTs ? parseInt(endTs) : now;

    // 3. Determine Aggregation Bucket Size
    // If the selected range is greater than 24 hours, group by Day. Otherwise, by Hour.
    const isDailyAggregation = end - start > 86400;

    // 4. Query Realtime Database
    const historyRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);
    const snapshot = await historyRef
      .orderByChild("timestamp")
      .startAt(start)
      .endAt(end)
      .get();

    if (!snapshot.exists())
      return NextResponse.json({ data: [], totalConsumption: 0 });

    const rawData = snapshot.val();
    const dataPoints = Object.values(rawData).sort(
      (a: any, b: any) => a.timestamp - b.timestamp,
    ) as any[];

    // 5. Aggregation Dictionaries
    let totalPeriodUsage = 0;
    let previousEMap: Record<string, number> = {};
    const chartAggregatedMap: Record<string, any> = {};

    dataPoints.forEach((entry) => {
      // Create the Time Bucket
      const d = new Date(entry.timestamp * 1000);
      if (isDailyAggregation) {
        d.setHours(0, 0, 0, 0);
      } else {
        d.setMinutes(0, 0, 0);
      }
      const timeBucketStr = d.toISOString();

      // Extract Raw Values
      let P = 0,
        Q = 0,
        V = 0,
        I = 0,
        usage = 0;

      if (requestedOutletId && requestedOutletId !== "total") {
        const o = entry[`O${requestedOutletId}`];
        if (o) {
          P = Number(o.P) || 0;
          Q = Number(o.Q) || 0;
          V = Number(o.V) || 0;
          I = Number(o.I) || 0;
          let E = Number(o.E) || 0;

          if (
            previousEMap[requestedOutletId] !== undefined &&
            E >= previousEMap[requestedOutletId]
          ) {
            usage = E - previousEMap[requestedOutletId];
          }
          previousEMap[requestedOutletId] = E;
        }
      } else {
        Object.keys(entry).forEach((key) => {
          if (key.startsWith("O") && typeof entry[key] === "object") {
            const outId = key.replace("O", "");
            P += Number(entry[key].P) || 0;
            Q += Number(entry[key].Q) || 0;
            I += Number(entry[key].I) || 0;
            V = Math.max(V, Number(entry[key].V) || 0); // Voltage is max, not additive

            let E = Number(entry[key].E) || 0;
            if (previousEMap[outId] !== undefined && E >= previousEMap[outId]) {
              usage += E - previousEMap[outId];
            }
            previousEMap[outId] = E;
          }
        });
      }

      totalPeriodUsage += usage;

      // Add to Chart Aggregation Map
      if (!chartAggregatedMap[timeBucketStr]) {
        chartAggregatedMap[timeBucketStr] = {
          date: timeBucketStr,
          usage: 0,
          P_sum: 0,
          Q_sum: 0,
          V_sum: 0,
          I_sum: 0,
          count: 0,
        };
      }

      chartAggregatedMap[timeBucketStr].usage += usage;
      chartAggregatedMap[timeBucketStr].P_sum += P;
      chartAggregatedMap[timeBucketStr].Q_sum += Q;
      chartAggregatedMap[timeBucketStr].V_sum += V;
      chartAggregatedMap[timeBucketStr].I_sum += I;
      chartAggregatedMap[timeBucketStr].count += 1;
    });

    // 6. Format Final Chart Output (Sum Energy, Average Live Metrics)
    const finalChartData = Object.values(chartAggregatedMap)
      .map((bucket: any) => ({
        date: bucket.date,
        usage: parseFloat(bucket.usage.toFixed(4)),
        realPower: parseFloat((bucket.P_sum / bucket.count).toFixed(2)),
        reactivePower: parseFloat((bucket.Q_sum / bucket.count).toFixed(2)),
        voltage: parseFloat((bucket.V_sum / bucket.count).toFixed(2)),
        current: parseFloat((bucket.I_sum / bucket.count).toFixed(2)),
      }))
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    return NextResponse.json({
      data: finalChartData,
      totalConsumption: parseFloat(totalPeriodUsage.toFixed(4)),
    });
  } catch (error: any) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
