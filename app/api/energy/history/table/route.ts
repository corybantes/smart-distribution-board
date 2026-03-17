import { NextResponse } from "next/server";
import { adminRtdb, adminDb, adminAuth } from "@/lib/firebase-admin";

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

  const { searchParams } = new URL(request.url);

  // We no longer extract 'uid' from searchParams!
  let outletId = searchParams.get("outletId");

  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const page = parseInt(searchParams.get("page") || "0");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // 2. Fetch User Profile using the SECURE token UID
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const smartDbId = userData.smartDbId;
    const role = userData.role;

    if (!smartDbId) {
      return NextResponse.json({ error: "No device linked" }, { status: 404 });
    }

    // 3. SECURITY OVERRIDE: Prevent Tenant Data Leaks
    // If a tenant tries to omit the outletId or guess another tenant's ID,
    // we force it to their exact assigned ID.
    if (role === "tenant") {
      outletId = userData.outletId;
    }

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
    const chartAggregatedMap: Record<string, any> = {};
    const tableAggregatedMap: Record<string, any> = {};

    dataPoints.forEach((entry) => {
      // Create the Time Bucket
      const d = new Date(entry.timestamp * 1000);
      if (isDailyAggregation) {
        d.setHours(0, 0, 0, 0);
      } else {
        d.setMinutes(0, 0, 0);
      }
      const timeBucketStr = d.toISOString();

      let totalUsageThisTick = 0;
      let breakdown: any[] = [];

      if (outletId && outletId !== "total") {
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

      // Add to CHART Aggregation
      if (!chartAggregatedMap[timeBucketStr]) {
        chartAggregatedMap[timeBucketStr] = { date: timeBucketStr, usage: 0 };
      }
      chartAggregatedMap[timeBucketStr].usage += totalUsageThisTick;

      // Add to TABLE Aggregation
      if (outletId && outletId !== "total") {
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
