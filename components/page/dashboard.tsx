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

  // FIX 1: Derive isAdmin dynamically directly from the profile!
  const isAdmin = profile?.role === "admin";

  // FIX 2: Check setup routing AFTER profile loads
  useEffect(() => {
    if (isAdmin && !profile?.isConfigured) {
      router.push(`/${user?.uid}/settings/setup`);
    }
  }, [profile, isAdmin, router, user?.uid]);

  // 3. Fetch Data
  const { data: energyData, isLoading: isEnergyLoading } =
    useSWR<EnergyApiResponse>(
      user ? `/api/energy?uid=${user.uid}` : null,
      fetcher,
      { refreshInterval: 2000 },
    );

  const { data: config } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher,
  );

  // 4. Fetch History Data (Using Unix Timestamps)
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
  const { data: billingData } = useSWR(
    user ? `/api/billing?uid=${user.uid}` : null,
    fetcher,
  );

  const historyAmounts = billingData?.history
    ?.map((h: any) => h.amount)
    .reverse() || [5000, 6000, 7000];
  const predictedAmount = predictNextBill(historyAmounts);
  const price = config?.pricePerKwh || 206.8; // Updated to match your default tariff
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

  // Global Loading State
  if (loadingUser || isLoadingProfile || !profile) {
    return <Loading />;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header Controls */}
        <div className="flex items-center gap-2 mt-4 w-full md:w-auto justify-end px-4 lg:px-6">
          <RangeSwitcher setSelectedRange={setSelectedRange} />
        </div>

        {/* 1. METRICS CARDS (Admin vs Tenant logic handled inside) */}
        {/* <DashboardCard
          user={user}
          profile={profile}
          energyData={energyData}
          totalCost={projectedBill}
          predictedCost={predictedAmount}
          totalUsage={totalUsage}
          isLoading={isEnergyLoading || isHistoryLoading} // Pass loading state down!
        /> */}

        <DashboardMetrics
          profile={profile}
          totalUsage={totalUsage}
          totalCost={projectedBill}
          predictedCost={predictedAmount}
          isLoading={isEnergyLoading || isHistoryLoading}
          selectedRange={selectedRange}
        />
        {/* 2. SYSTEM HEALTH CARDS (Admin Only) */}
        {isAdmin && (
          <HardwareAdminList
            energyData={energyData}
            outlets={visibleOutlets}
            user={user}
            isLoading={isHistoryLoading}
            profile={profile}
          />
        )}
        {!isAdmin && (
          <HardwareTenantWidget
            outlet={visibleOutlets[0]}
            isLoading={isHistoryLoading}
          />
        )}

        <div className="px-4 lg:px-6 space-y-6">
          {/* 3. MAIN CHART */}
          <ChartAreaDefault
            chartConfig={chartConfig}
            chartData={historyData}
            chartDescription={chartDescription}
            chartTitle={chartTitle}
            dataKey={"usage"}
            selectedRange={selectedRange}
            isLoading={isHistoryLoading} // Pass loading state down!
          />
        </div>
      </div>
    </div>
  );
}
