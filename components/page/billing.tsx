"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { predictNextBill } from "@/lib/prediction";
import BillingTable from "../layout/billing/billing-table";
import BillingTopup from "../layout/billing/billing-topup";
import BillingChart from "../layout/billing/billing-chart";
import BillingCard from "../layout/billing/billing-card";
import { fetcher } from "@/lib/utils";
import BillingAdminChart from "../layout/billing/billing-admin-chart";

export default function Billing() {
  const { user } = useAuth();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [page, setPage] = useState(1);

  // 1. Fetch User Profile (Extract isLoading)
  const { data: profile, isLoading: isLoadingProfile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  const isAdmin = profile?.role === "admin";

  // 2. Fetch Paginated Table Data (Extract isLoading)
  const { data: billingTableData, isLoading: isTableLoading } = useSWR(
    user ? `/api/billing/table?uid=${user.uid}&page=${page}&limit=5` : null,
    fetcher,
  );

  // 3. Fetch Tariff Rate (Extract isLoading)
  const { data: config, isLoading: isLoadingConfig } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher,
  );

  // 4. Fetch Outlets for Top-Up Modal (Extract isLoading)
  const { data: outlets, isLoading: isLoadingOutlets } = useSWR(
    isAdmin && user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher,
  );

  // --- PREDICTION & GRAPH LOGIC ---
  const price = config?.pricePerKwh || 206.8;
  const historicalData = profile?.historicalBills || [];
  const predictedAmount = isAdmin ? 0 : predictNextBill(historicalData);

  const graphData = historicalData.map((amount: number, index: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (historicalData.length - index));

    return {
      name: d.toLocaleString("default", { month: "short", year: "numeric" }),
      cost: amount,
    };
  });

  if (!isAdmin && graphData.length > 0) {
    graphData.push({
      name: "Next Month",
      cost: predictedAmount,
      isPrediction: true,
    });
  }

  return (
    <div className="flex flex-col flex-1 w-full gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20">
      {/* TOP ROW: GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* 1. BALANCE CARD */}
        <div className="flex w-full h-full">
          <BillingCard
            setIsTopUpOpen={setIsTopUpOpen}
            billingData={{
              balance: profile?.balance || 0,
              unbilledAmount: profile?.unbilledAmount || 0,
            }}
            user={profile}
            outlets={outlets}
            pricePerKwh={price}
            isLoading={isLoadingProfile}
          />
        </div>

        {/* 2. DYNAMIC RIGHT CARD */}
        <div className="flex w-full h-full">
          {!isAdmin ? (
            <BillingChart
              historyAmounts={historicalData}
              graphData={graphData}
              predictedAmount={predictedAmount}
              isLoading={isLoadingProfile || isLoadingConfig}
            />
          ) : (
            <BillingAdminChart
              outlets={outlets?.data || outlets || []}
              isLoading={isLoadingOutlets}
            />
          )}
        </div>
      </div>

      {/* 3. HISTORY TABLE */}
      <BillingTable
        uid={user?.uid || ""}
        billingData={billingTableData?.data || []}
        currentPage={page}
        totalPages={billingTableData?.meta?.totalPages || 1}
        onPageChange={(newPage: number) => setPage(newPage)}
        loading={isTableLoading || isLoadingProfile}
      />

      {/* TOP-UP MODAL (Dialog) */}
      {isAdmin && (
        <BillingTopup
          user={user}
          isTopUpOpen={isTopUpOpen}
          setIsTopUpOpen={setIsTopUpOpen}
          outlets={outlets}
        />
      )}
    </div>
  );
}
