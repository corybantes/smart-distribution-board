import { NextResponse } from "next/server";
import { adminRtdb, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const outletId = searchParams.get("outletId");

  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const page = parseInt(searchParams.get("page") || "0");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const smartDbId = userDoc.data()?.smartDbId;
    if (!smartDbId)
      return NextResponse.json({ error: "No device linked" }, { status: 404 });

    const now = Math.floor(Date.now() / 1000);
    const start = startParam ? parseInt(startParam) : now - 86400;
    const end = endParam ? parseInt(endParam) : now;

    // Determine the Aggregation Bucket Size
    // If the selected range is greater than 24 hours (86400 seconds), group by Day. Otherwise, by Hour.
    const isDailyAggregation = end - start > 86400;

    const historyRef = adminRtdb.ref(`Devices/ESP_${smartDbId}/History`);
    const snapshot = await historyRef
      .orderByChild("timestamp")
      .startAt(start)
      .endAt(end)
      .get();

    if (!snapshot.exists()) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, pages: 0, page: 1, limit },
        totalConsumption: 0,
      });
    }

    const rawData = snapshot.val();
    const dataPoints = Object.values(rawData).sort(
      (a: any, b: any) => a.timestamp - b.timestamp,
    ) as any[];

    let totalPeriodUsage = 0;
    let previousEMap: Record<string, number> = {};

    // --- AGGREGATION MAPS ---
    // We create separate maps for the Chart (Combined sums) and Table (Flattened by Outlet)
    const chartAggregatedMap: Record<string, any> = {};
    const tableAggregatedMap: Record<string, any> = {};

    dataPoints.forEach((entry) => {
      // 1. Create the Time Bucket (Truncate the date to either the Hour or the Day)
      const d = new Date(entry.timestamp * 1000);
      if (isDailyAggregation) {
        d.setHours(0, 0, 0, 0); // Round down to start of the Day
      } else {
        d.setMinutes(0, 0, 0); // Round down to start of the Hour
      }
      const timeBucketStr = d.toISOString();

      // 2. Calculate the Raw Usage for this specific tick
      let totalUsageThisTick = 0;
      let breakdown: any[] = [];

      if (outletId) {
        let currentE = Number(entry[`O${outletId}`]?.E) || 0;
        let usage = 0;
        if (
          previousEMap[outletId] !== undefined &&
          currentE >= previousEMap[outletId]
        ) {
          usage = currentE - previousEMap[outletId];
        }
        previousEMap[outletId] = currentE;
        totalUsageThisTick = usage;
      } else {
        Object.keys(entry).forEach((key) => {
          if (key.startsWith("O") && typeof entry[key] === "object") {
            const currentOutletId = key.replace("O", "");
            let currentE = Number(entry[key].E) || 0;
            let usage = 0;

            if (
              previousEMap[currentOutletId] !== undefined &&
              currentE >= previousEMap[currentOutletId]
            ) {
              usage = currentE - previousEMap[currentOutletId];
            }
            previousEMap[currentOutletId] = currentE;
            totalUsageThisTick += usage;

            breakdown.push({ outletId: currentOutletId, usage: usage });
          }
        });
      }

      totalPeriodUsage += totalUsageThisTick;

      // 3. Add to CHART Aggregation (Groups everything purely by Time)
      if (!chartAggregatedMap[timeBucketStr]) {
        chartAggregatedMap[timeBucketStr] = { date: timeBucketStr, usage: 0 };
      }
      chartAggregatedMap[timeBucketStr].usage += totalUsageThisTick;

      // 4. Add to TABLE Aggregation (Groups by Time AND Outlet)
      if (outletId) {
        const tableKey = timeBucketStr;
        if (!tableAggregatedMap[tableKey]) {
          tableAggregatedMap[tableKey] = {
            date: timeBucketStr,
            usage: 0,
            outletId,
          };
        }
        tableAggregatedMap[tableKey].usage += totalUsageThisTick;
      } else {
        breakdown.forEach((b) => {
          const tableKey = `${timeBucketStr}_${b.outletId}`;
          if (!tableAggregatedMap[tableKey]) {
            tableAggregatedMap[tableKey] = {
              date: timeBucketStr,
              usage: 0,
              outletId: b.outletId,
            };
          }
          tableAggregatedMap[tableKey].usage += b.usage;
        });
      }
    });

    // Convert the aggregated maps back into arrays
    const finalChartData = Object.values(chartAggregatedMap).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const finalTableData = Object.values(tableAggregatedMap).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // --- RETURN PAGINATED TABLE DATA ---
    if (page > 0) {
      // Reverse so newest is at the top of the table
      const reversedData = [...finalTableData].reverse();

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = reversedData.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedData,
        meta: {
          total: finalTableData.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(finalTableData.length / limit),
        },
      });
    }

    // --- RETURN CHART DATA ---
    return NextResponse.json({
      data: finalChartData,
      totalConsumption: totalPeriodUsage,
    });
  } catch (error: any) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
