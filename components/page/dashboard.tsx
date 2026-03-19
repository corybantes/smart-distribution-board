"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ChartAreaDefault } from "../layout/dashboard/area-chart";
import { ChartConfig } from "../ui/chart";
import {
  EnergyApiResponse,
  fetcher,
  HistoryApiResponse,
  UserProfile,
} from "@/lib/utils";
import Loading from "../layout/general/Loading";
import { predictNextBill } from "@/lib/prediction";
import RangeSwitcher from "../layout/consumption/range-switcher";
import { getDateRanges } from "@/lib/date-utils";
import DashboardMetrics from "../layout/dashboard/dashboard-metrics";
import HardwareAdminList from "../layout/dashboard/hardware-admin-list";
import HardwareTenantWidget from "../layout/dashboard/hardware-tenant-widget";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedRange, setSelectedRange] = useState(getDateRanges()[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("total");

  // 1. Monitor Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
      setLoadingUser(false);
    });
    return () => unsub();
  }, [router]);

  // 2. Fetch User Profile
  const { data: profile, isLoading: isLoadingProfile } = useSWR<UserProfile>(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  const isAdmin = profile?.role === "admin";

  // Check setup routing AFTER profile completes loading
  useEffect(() => {
    if (!isLoadingProfile && isAdmin && !profile?.isConfigured) {
      router.push(`/${user?.uid}/settings/setup`);
    }
  }, [profile, isLoadingProfile, isAdmin, router, user?.uid]);

  // 3. Fetch Live Energy Data & Config
  const { data: energyData, isLoading: isEnergyLoading } =
    useSWR<EnergyApiResponse>(
      user ? `/api/energy?uid=${user.uid}` : null,
      fetcher,
      { refreshInterval: 2000 },
    );

  const { data: config, isLoading: isLoadingConfig } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher,
  );

  // 4. Fetch History Data
  const historyUrl = user
    ? `/api/energy/history?uid=${user.uid}&startDate=${
        selectedRange.startTs
      }&endDate=${selectedRange.endTs}${
        selectedOutlet !== "total" ? `&outletId=${selectedOutlet}` : ""
      }`
    : null;

  const { data: apiResponse, isLoading: isHistoryLoading } =
    useSWR<HistoryApiResponse>(historyUrl, fetcher);

  const historyData = apiResponse?.data || [];
  const totalUsage = apiResponse?.totalConsumption || 0;

  // 5. Billing & Prediction Math
  const historicalData = profile?.historicalBills || [];
  const predictedAmount = isAdmin ? 0 : predictNextBill(historicalData);

  const price = config?.pricePerKwh || 206.8;
  const projectedBill = totalUsage * price;

  // 6. Dynamic Chart Headers
  const chartTitle = isAdmin ? "Total Building Load" : "My Usage History";
  const chartDescription = isAdmin
    ? "Aggregated consumption for all outlets"
    : `Outlet #${profile?.outletId || "N/A"} Analysis`;

  const chartConfig = {
    desktop: {
      label: "Energy (kWh)",
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig;

  const visibleOutlets = (energyData?.outlets || []).filter((outlet) => {
    if (isAdmin) return true;
    return String(outlet.id) === String(profile?.outletId);
  });

  // Combine loading states for smooth skeleton rendering
  const isMetricsLoading =
    isLoadingProfile || isEnergyLoading || isHistoryLoading || isLoadingConfig;
  const isHardwareLoading = isLoadingProfile || isEnergyLoading;
  const isChartLoading = isLoadingProfile || isHistoryLoading;

  // Full page loader ONLY for initial auth check
  if (loadingUser || !user) {
    return <Loading />;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header Controls */}
        <div className="flex items-center gap-2 mt-4 w-full md:w-auto justify-end px-4 lg:px-6">
          <RangeSwitcher setSelectedRange={setSelectedRange} />
        </div>

        {/* 1. METRICS CARDS */}
        <DashboardMetrics
          profile={profile}
          totalUsage={totalUsage}
          totalCost={projectedBill}
          predictedCost={predictedAmount}
          isLoading={isMetricsLoading}
          selectedRange={selectedRange}
        />

        {/* 2. SYSTEM HEALTH CARDS */}
        {isAdmin ? (
          <HardwareAdminList
            energyData={energyData}
            outlets={visibleOutlets}
            user={user}
            isLoading={isHardwareLoading}
            profile={profile}
          />
        ) : (
          <HardwareTenantWidget
            outlet={visibleOutlets[0]}
            userProfile={profile}
            isLoading={isHardwareLoading}
          />
        )}

        {/* 3. MAIN CHART */}
        <div className="px-4 lg:px-6 space-y-6">
          <ChartAreaDefault
            chartConfig={chartConfig}
            chartData={historyData}
            chartDescription={chartDescription}
            chartTitle={chartTitle}
            dataKey={"usage"}
            selectedRange={selectedRange}
            isLoading={isChartLoading}
          />
        </div>
      </div>
    </div>
  );
}
