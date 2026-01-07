"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { ChartAreaDefault } from "../layout/dashboard/area-chart";
import { ChartConfig } from "../ui/chart";
import DashboardCard from "../layout/dashboard/dashboard-card";
import DashboardSystemCard from "../layout/dashboard/dashboard-system-card";
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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedRange, setSelectedRange] = useState(getDateRanges()[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("total");
  const [isAdmin, setIsAdmin] = useState(false);

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

  // 2. Fetch User Profile via API (Once)
  const { data: profile, isLoading: isLoadingProfile } = useSWR<UserProfile>(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher
  );

  // 3. Fetch Realtime Energy Data via API (Polls every 2s)
  const { data: energyData } = useSWR<EnergyApiResponse>(
    user ? `/api/energy?uid=${user.uid}` : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  const { data: config } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher
    // { refreshInterval: 2000 }
  );

  const { data: outlets } = useSWR(
    isAdmin && user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher
    // { refreshInterval: 2000 }
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
    fetcher
    // { refreshInterval: 2000 }
  );
  // 3. Extract the array for the chart
  const historyData = apiResponse?.data || [];

  const { data: billingData, isLoading: isBillingLoading } = useSWR(
    user ? `/api/billing?uid=${user.uid}` : null,
    fetcher
    // { refreshInterval: 2000 }
  );

  const historyAmounts =
    billingData?.history?.map((h: any) => h.amount).reverse() || [];
  const predictedAmount = predictNextBill(historyAmounts);

  // 4. Extract the pre-calculated Total from the API
  const totalUsage = apiResponse?.totalConsumption || 0;

  // 5. Calculate Financials
  const price = config?.pricePerKwh || 100;
  const projectedBill = totalUsage * price;

  const chartTitle =
    profile?.role === "admin" ? "Total Building Load" : "My Usage History";
  const chartDescription =
    profile?.role === "admin"
      ? "Aggregated consumption"
      : `Outlet #${profile?.outletId} Analysis`;
  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Loading State
  if (loadingUser || isLoadingProfile || !energyData) {
    return <Loading />;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Range Switcher */}
        <div className="flex items-center gap-2 mt-4 w-full md:w-auto justify-end px-4 lg:px-6">
          <RangeSwitcher setSelectedRange={setSelectedRange} />
        </div>
        {/* <SectionCards /> */}
        <DashboardCard
          profile={profile}
          energyData={energyData}
          user={user}
          totalCost={projectedBill}
          predictedCost={predictedAmount}
          totalUsage={totalUsage}
        />
        <div className="px-4 lg:px-6 space-y-4">
          {/* 1. CHART SECTION */}
          <ChartAreaDefault
            chartConfig={chartConfig}
            chartData={historyData}
            chartDescription={chartDescription}
            chartTitle={chartTitle}
            dataKey={"usage"}
            selectedRange={selectedRange}
          />
          {/* 4. SYSTEM HEALTH (Admin Only) */}
          {profile?.role === "admin" && (
            <DashboardSystemCard energyData={energyData} />
          )}
        </div>
      </div>
    </div>
  );
}
