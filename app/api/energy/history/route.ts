import { NextResponse } from "next/server";
import { adminRtdb, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const outletId = searchParams.get("outletId");

  // Optional Date Filters (ISO Strings)
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Get SmartDB ID
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const smartDbId = userDoc.data()?.smartDbId;

    if (!smartDbId)
      return NextResponse.json({ error: "No device linked" }, { status: 404 });

    // 2. Define Time Range
    // Default: Last 24 hours if no dates provided
    const now = Math.floor(Date.now() / 1000);
    const start = startParam
      ? Math.floor(new Date(startParam).getTime() / 1000)
      : now - 86400;
    const end = endParam
      ? Math.floor(new Date(endParam).getTime() / 1000)
      : now;

    // 3. Query Realtime Database
    const historyRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);

    const snapshot = await historyRef
      .orderByChild("timestamp")
      .startAt(start)
      .endAt(end)
      .get();

    if (!snapshot.exists()) return NextResponse.json([]);

    const rawData = snapshot.val();
    // Convert object to array and sort by timestamp to ensure correct order
    const dataPoints = Object.values(rawData).sort(
      (a: any, b: any) => a.timestamp - b.timestamp
    ) as any[];

    // 4. Process Data
    let previousTimestamp = dataPoints[0]?.timestamp || start;
    let totalKwh = 0;

    const result = dataPoints.map((entry, index) => {
      let realPower = 0;
      let reactivePower = 0;
      let voltage = 0;
      let current = 0;

      // Extract specific outlet data or sum total
      if (outletId) {
        const o = entry[`O${outletId}`];
        if (o) {
          realPower = Number(o.P) || 0;
          reactivePower = Number(o.Q) || 0;
          voltage = Number(o.V) || 0;
          current = Number(o.I) || 0;
        }
      } else {
        Object.keys(entry).forEach((key) => {
          if (key.startsWith("O") && typeof entry[key] === "object") {
            realPower += Number(entry[key].P) || 0;
            reactivePower += Number(entry[key].Q) || 0;
            current += Number(entry[key].I) || 0;
            voltage = Math.max(voltage, Number(entry[key].V) || 0);
          }
        });
      }

      // 5. Calculate Usage (kWh) for this interval
      // Usage = (Power(W) * TimeDiff(s)) / 3600 / 1000
      const currentTimestamp = entry.timestamp;
      const timeDiff = currentTimestamp - previousTimestamp; // Seconds since last reading

      // Handle the first point or large gaps (ignore gaps > 1 hour to prevent spikes)
      let usage = 0;
      if (index > 0 && timeDiff > 0 && timeDiff < 3600) {
        usage = (realPower * timeDiff) / 3600000;
      }

      previousTimestamp = currentTimestamp;
      totalKwh += usage;

      return {
        timestamp: entry.timestamp,
        date: new Date(entry.timestamp * 1000).toISOString(),
        usage: parseFloat(usage.toFixed(6)), // Small interval usage
        realPower,
        reactivePower,
        voltage,
        current,
      };
    });

    return NextResponse.json({
      data: result,
      totalConsumption: parseFloat(totalKwh.toFixed(4)),
    });
  } catch (error: any) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
