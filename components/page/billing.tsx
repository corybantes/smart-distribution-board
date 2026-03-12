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
import { Wallet } from "lucide-react";

export default function Billing() {
  const { user } = useAuth();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: profile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  // 1. Fetch Paginated Table Data (Transactions Ledger)
  const { data: billingTableData, isLoading: isTableLoading } = useSWR(
    user ? `/api/billing/table?uid=${user.uid}&page=${page}&limit=5` : null,
    fetcher,
  );

  // 2. Fetch General Billing Data (Balance, History, and Monthly Usage)
  const { data: billingData, isLoading } = useSWR(
    user ? `/api/billing?uid=${user.uid}` : null,
    fetcher,
  );

  // 3. Fetch Tariff Rate (Required for accurate cost prediction)
  const { data: config } = useSWR(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher,
  );

  // 4. Fetch Outlets for Top-Up Modal
  const { data: outlets } = useSWR(
    user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher,
  );

  // --- PREDICTION LOGIC (3-Month WMA) ---
  const price = config?.pricePerKwh || 206.8; // Fallback to Band A rate

  // Extract past energy (kWh) usage, reverse them (oldest first)
  const historyEnergy =
    billingData?.monthlyUsage?.map((h: any) => h.usage || 0).reverse() || [];

  // Predict next month's Energy (kWh), then convert to NGN
  const predictedEnergyKwh = predictNextBill(historyEnergy);
  const predictedAmount = predictedEnergyKwh * price;

  // --- PREPARE GRAPH DATA ---
  const graphData = [
    ...(billingData?.monthlyUsage
      ?.slice(0, 5)
      .reverse()
      .map((h: any) => ({
        name: h.month, // e.g., "2026-02"
        cost: (h.usage || 0) * price, // Convert historical kWh to Cost
      })) || []),
    { name: "Next Month", cost: predictedAmount, isPrediction: true },
  ];

  // FIX: Only show full-page loader on INITIAL load, not during table pagination!
  if (isLoading || !profile) return <Loading />;

  return (
    <div className="flex flex-col flex-1 w-full gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20">
      {/* PAGE HEADER */}
      {/* <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Wallet size={24} />
          </div>
          Billing & Wallet
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Manage your energy credits, view AI-powered usage forecasts, and track
          your complete transaction history.
        </p>
      </div> */}

      {/* TOP ROW: GRID LAYOUT FOR EQUAL HEIGHTS */}
      {/* FIX: Changed from flex to grid grid-cols-1 lg:grid-cols-2 with items-stretch */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* 1. BALANCE CARD */}
        <div className="flex w-full h-full">
          <BillingCard
            setIsTopUpOpen={setIsTopUpOpen}
            billingData={billingData}
            user={profile}
            pricePerKwh={price}
          />
        </div>

        {/* 2. PREDICTION CARD (WMA Powered) */}
        <div className="flex w-full h-full">
          <BillingChart
            historyAmounts={historyEnergy.map((e: number) => e * price)}
            graphData={graphData}
            predictedAmount={predictedAmount}
          />
        </div>
      </div>

      {/* 3. HISTORY TABLE */}
      {/* FIX: Pass the table loading state directly to the table component */}
      <BillingTable
        uid={user?.uid || ""}
        billingData={billingTableData?.data || []}
        currentPage={page}
        totalPages={billingTableData?.meta?.totalPages || 1}
        onPageChange={(newPage: number) => setPage(newPage)}
        loading={isTableLoading}
      />

      {/* TOP-UP MODAL (Dialog) */}
      {profile?.role === "admin" && (
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
