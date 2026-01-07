import { NextResponse } from "next/server";
import { adminRtdb, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const outletId = searchParams.get("outletId");

  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const page = parseInt(searchParams.get("page") || "0"); // 0 = No Pagination (for Charts)
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    // 1. Get SmartDB ID
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const smartDbId = userDoc.data()?.smartDbId;
    if (!smartDbId)
      return NextResponse.json({ error: "No device linked" }, { status: 404 });

    // 2. Define Time Range
    const now = Math.floor(Date.now() / 1000);
    const start = startParam
      ? Math.floor(new Date(startParam).getTime() / 1000)
      : now - 86400;
    const end = endParam
      ? Math.floor(new Date(endParam).getTime() / 1000)
      : now;

    // 3. Query Realtime DB
    const historyRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);
    const snapshot = await historyRef
      .orderByChild("timestamp")
      .startAt(start)
      .endAt(end)
      .get();

    if (!snapshot.exists()) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, pages: 0 },
        totalConsumption: 0,
      });
    }

    const rawData = snapshot.val();

    // 4. CRITICAL: Sort Oldest -> Newest to calculate Usage correctly
    const dataPoints = Object.values(rawData).sort(
      (a: any, b: any) => a.timestamp - b.timestamp
    ) as any[];

    // 5. CALCULATE USAGE (The Math Loop)
    let previousTimestamp = dataPoints[0]?.timestamp || start;
    let totalPeriodUsage = 0;

    const calculatedData = dataPoints.map((entry, index) => {
      let realPower = 0;
      // ... (Voltage/Current extraction logic)
      if (outletId) {
        const o = entry[`O${outletId}`];
        if (o) realPower = Number(o.P) || 0;
      } else {
        Object.keys(entry).forEach((key) => {
          if (key.startsWith("O") && typeof entry[key] === "object") {
            realPower += Number(entry[key].P) || 0;
          }
        });
      }

      // Usage Math: Power (W) * Time (s) / 3600000 = kWh
      const currentTimestamp = entry.timestamp;
      const timeDiff = currentTimestamp - previousTimestamp;

      let usage = 0;
      // Filter out massive time jumps (e.g. > 1 hour) which imply device was off
      if (index > 0 && timeDiff > 0 && timeDiff < 3600) {
        usage = (realPower * timeDiff) / 3600000;
      }

      previousTimestamp = currentTimestamp;
      totalPeriodUsage += usage;

      return {
        ...entry,
        date: new Date(entry.timestamp * 1000).toISOString(),
        usage: usage, // This adds the field to the object!
        realPower,
      };
    });

    // 6. Handle Pagination (Reverse Order: Newest -> Oldest for Tables)
    if (page > 0) {
      // Reverse so the table shows "Now" at the top
      const reversedData = [...calculatedData].reverse();

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = reversedData.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedData,
        meta: {
          total: calculatedData.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(calculatedData.length / limit),
        },
      });
    }

    // 7. Return Full Data (For Charts)
    return NextResponse.json({
      data: calculatedData,
      totalConsumption: totalPeriodUsage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
