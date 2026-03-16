"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { differenceInDays, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import ConsumptionChart from "../layout/consumption/consumption-chart";
import ConsumptionTable from "../layout/consumption/consumption-table";
import ConsumptionCard from "../layout/consumption/consumption-card";
import OutletSwitcher from "../layout/consumption/outlet-switcher";
import RangeSwitcher from "../layout/consumption/range-switcher";
import Loading from "../layout/general/Loading"; // <-- Imported your new Loading component
import { fetcher, HistoryApiResponse } from "@/lib/utils";
import { getDateRanges } from "@/lib/date-utils";

export default function Consumption() {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState(getDateRanges()[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("total");

  // 1. REFACTOR: Fetch User Profile via SWR to get the `isLoadingProfile` state
  const { data: profile, isLoading: isLoadingProfile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  const isAdmin = profile?.role === "admin";

  // Automatically set the selected outlet for tenants once profile loads
  useEffect(() => {
    if (profile && !isAdmin) {
      setSelectedOutlet(profile.outletId);
    }
  }, [profile, isAdmin]);

  // 2. Fetch System Config
  const { data: config, isLoading: isLoadingConfig } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher,
  );

  // 3. Fetch Outlets (Admins only)
  const { data: outlets } = useSWR(
    isAdmin && user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher,
  );

  // 4. Fetch Chart History
  const historyUrl = user
    ? `/api/energy/history?uid=${user.uid}&startDate=${
        selectedRange.startTs
      }&endDate=${selectedRange.endTs}${
        selectedOutlet !== "total" ? `&outletId=${selectedOutlet}` : ""
      }`
    : null;

  const { data: apiResponse, isLoading: isHistoryLoading } =
    useSWR<HistoryApiResponse>(historyUrl, fetcher, { refreshInterval: 2000 });

  const historyData = apiResponse?.data || [];
  const totalUsage = apiResponse?.totalConsumption || 0;

  // 5. Calculate Financials
  const price = config?.pricePerKwh || 206.8;
  const projectedBill = totalUsage * price;

  // 6. Calculate Real Average Daily Usage
  const daysDiff = Math.max(
    1,
    differenceInDays(
      parseISO(selectedRange.endDate),
      parseISO(selectedRange.startDate),
    ) + 1, // +1 to include the start day itself
  );
  const avgDaily = totalUsage / daysDiff;

  // 7. Fetch Table Data
  const [tablePage, setTablePage] = useState(1);
  const tableUrl = user
    ? `/api/energy/history/table?uid=${user.uid}&startDate=${selectedRange.startTs}&endDate=${selectedRange.endTs}&page=${tablePage}&limit=10${selectedOutlet !== "total" ? `&outletId=${selectedOutlet}` : ""}`
    : null;

  const { data: tableResponse, isLoading: tableLoading } = useSWR(
    tableUrl,
    fetcher,
  );

  // Combine loading states for the visual skeletons
  const isGlobalLoading =
    isLoadingProfile || isLoadingConfig || isHistoryLoading;

  // FULL PAGE LOADER ONLY FOR AUTH CHECK
  if (!user) return <Loading />;

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
        isLoading={isGlobalLoading} // <-- Passes combined loading state!
        avgDaily={avgDaily}
        selectedRange={selectedRange}
        totalUsage={totalUsage}
      />

      {/* 3. MAIN CHART */}
      <ConsumptionChart
        selectedRange={selectedRange}
        historyData={historyData}
        isLoading={isGlobalLoading} // <-- Passes combined loading state!
      />

      {/* 4. HISTORY TABLE */}
      <ConsumptionTable
        data={tableResponse?.data || []}
        price={price}
        loading={tableLoading || isLoadingProfile} // <-- Shows Skeleton on load, Spinner on pagination
        isAdmin={isAdmin}
        currentPage={tablePage}
        totalPages={tableResponse?.meta?.totalPages || 1}
        onPageChange={setTablePage}
      />
    </div>
  );
}
