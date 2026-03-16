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
import Loading from "../layout/general/Loading";
import BillingAdminChart from "../layout/billing/billing-admin-chart";

export default function Billing() {
  const { user } = useAuth();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [page, setPage] = useState(1);

  // 1. Fetch User Profile (Now contains historicalBills!)
  const { data: profile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  const isAdmin = profile?.role === "admin";

  // 2. Fetch Paginated Table Data (Transactions Ledger)
  const { data: billingTableData, isLoading: isTableLoading } = useSWR(
    user ? `/api/billing/table?uid=${user.uid}&page=${page}&limit=5` : null,
    fetcher,
  );

  // 3. Fetch Tariff Rate (Required for accurate cost prediction)
  const { data: config } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher,
  );

  // 4. Fetch Outlets for Top-Up Modal (Only needed for Admins)
  const { data: outlets } = useSWR(
    isAdmin && user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher,
  );

  // --- PREDICTION & GRAPH LOGIC ---
  const price = config?.pricePerKwh || 206.8;

  // Extract the array directly from the profile.
  // (Our Cron Job already saved these as Naira amounts, not kWh!)
  const historicalData = profile?.historicalBills || [];

  // Admins don't get a predicted bill, tenants do.
  const predictedAmount = isAdmin ? 0 : predictNextBill(historicalData);

  // Dynamically generate the Graph Data with Month Labels
  const graphData = historicalData.map((amount: number, index: number) => {
    const d = new Date();
    // Count backwards based on the array length (e.g., 3 months ago, 2 months ago...)
    d.setMonth(d.getMonth() - (historicalData.length - index));

    return {
      name: d.toLocaleString("default", { month: "short", year: "numeric" }), // e.g., "Jan 2026"
      cost: amount,
    };
  });

  // Add the prediction to the end of the graph for tenants
  if (!isAdmin && graphData.length > 0) {
    graphData.push({
      name: "Next Month",
      cost: predictedAmount,
      isPrediction: true,
    });
  }

  // Only show full-page loader on INITIAL load
  if (!profile) return <Loading />;

  return (
    <div className="flex flex-col flex-1 w-full gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20">
      {/* TOP ROW: GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* 1. BALANCE CARD */}
        <div className="flex w-full h-full">
          <BillingCard
            setIsTopUpOpen={setIsTopUpOpen}
            // Passing a mocked object so we don't break your BillingCard's internal props
            billingData={{
              balance: profile.balance || 0,
              unbilledAmount: profile.unbilledAmount || 0,
            }}
            user={profile}
            pricePerKwh={price}
          />
        </div>

        {/* 2. PREDICTION CARD (Hidden for Admins as it doesn't apply to them) */}
        <div className="flex w-full h-full">
          {!isAdmin ? (
            <BillingChart
              historyAmounts={historicalData}
              graphData={graphData}
              predictedAmount={predictedAmount}
            />
          ) : (
            <BillingAdminChart outlets={outlets?.data || outlets || []} />
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
        loading={isTableLoading}
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
