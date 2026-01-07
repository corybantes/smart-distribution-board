"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { differenceInDays, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import ConsumptionChart from "../layout/consumption/consumption-chart";
import ConsumptionTable from "../layout/consumption/consumption-table";
import ConsumptionCard from "../layout/consumption/consumption-card";
import OutletSwitcher from "../layout/consumption/outlet-switcher";
import RangeSwitcher from "../layout/consumption/range-switcher";
import {
  fetcher,
  HistoryApiResponse,
  HistoryChartData,
  HistoryData,
} from "@/lib/utils";
import { getDateRanges } from "@/lib/date-utils";

export default function Consumption() {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState(getDateRanges()[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("total");
  const [isAdmin, setIsAdmin] = useState(false);
  const [tenantOutletId, setTenantOutletId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetch(`/api/user?uid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            setTenantOutletId(data.outletId);
            setSelectedOutlet(data.outletId);
          }
        });
    }
  }, [user]);

  const { data: config } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher
  );

  const { data: outlets } = useSWR(
    isAdmin && user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher
  );

  const historyUrl = user
    ? `/api/energy/history?uid=${user.uid}&startDate=${
        selectedRange.startDate
      }&endDate=${selectedRange.endDate}${
        selectedOutlet !== "total" ? `&outletId=${selectedOutlet}` : ""
      }`
    : null;

  const { data: apiResponse, isLoading } = useSWR<HistoryApiResponse>(
    historyUrl,
    fetcher,
    { refreshInterval: 2000 }
  );
  // 3. Extract the array for the chart
  const historyData = apiResponse?.data || [];

  // 4. Extract the pre-calculated Total from the API
  const totalUsage = apiResponse?.totalConsumption || 0;

  // 5. Calculate Financials
  const price = config?.pricePerKwh || 100;
  const projectedBill = totalUsage * price;

  // 6. Calculate Real Average Daily Usage
  // We calculate the number of days selected, ensuring it's at least 1 to avoid division by zero.
  const daysDiff = Math.max(
    1,
    differenceInDays(
      parseISO(selectedRange.endDate),
      parseISO(selectedRange.startDate)
    ) + 1 // +1 to include the start day itself
  );

  const avgDaily = totalUsage / daysDiff;
  // const totalUsage = 0;
  // const projectedBill = 0;
  // const avgDaily = 0;

  const [tablePage, setTablePage] = useState(1);

  // URL includes 'page' parameter
  const tableUrl = user
    ? `/api/energy/history/table?uid=${user.uid}&startDate=${selectedRange.startDate}&endDate=${selectedRange.endDate}&page=${tablePage}&limit=10`
    : null;

  const { data: tableResponse, isLoading: tableLoading } = useSWR(
    tableUrl,
    fetcher
  );
  if (!user)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20">
      {/* 1. CONTROLS HEADER */}
      <div className="flex justify-between items-start md:items-center gap-4">
        <div></div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Admin: Outlet Switcher */}
          {isAdmin && (
            <OutletSwitcher
              selectedOutlet={selectedOutlet}
              setSelectedOutlet={setSelectedOutlet}
              outlets={outlets}
            />
          )}

          {/* Range Switcher */}
          <RangeSwitcher setSelectedRange={setSelectedRange} />
        </div>
      </div>

      {/* 2. STATS ROW */}
      <ConsumptionCard
        price={price}
        projectedBill={projectedBill}
        isLoading={isLoading}
        avgDaily={avgDaily}
        startDate={selectedRange.startDate}
        endDate={selectedRange.endDate}
        totalUsage={totalUsage}
      />

      {/* 3. MAIN CHART */}
      <ConsumptionChart
        selectedRange={selectedRange}
        historyData={historyData}
        isLoading={isLoading}
      />

      {/* 4. HISTORY TABLE */}
      <ConsumptionTable
        data={tableResponse?.data || []}
        price={config?.pricePerKwh || 100}
        loading={tableLoading}
        currentPage={tablePage}
        totalPages={tableResponse?.meta?.totalPages || 1}
        onPageChange={setTablePage} // This triggers SWR re-fetch
      />
    </div>
  );
}
