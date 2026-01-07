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

export default function Billing() {
  const { user } = useAuth();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  // 1. Add Page State
  const [page, setPage] = useState(1);

  // 2. Update SWR URL
  const { data: billingTableData, isLoading: isTableLoading } = useSWR(
    user ? `/api/billing/table?uid=${user.uid}&page=${page}&limit=5` : null,
    fetcher
  );

  const { data: billingData, isLoading } = useSWR(
    user ? `/api/billing?uid=${user.uid}` : null,
    fetcher
  );

  const { data: outlets } = useSWR(
    user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher
  );

  // --- PREDICTION LOGIC (ML Implementation) ---
  // We extract past amounts, reverse them (oldest first), and predict next month.
  const historyAmounts =
    billingData?.history?.map((h: any) => h.amount).reverse() || [];
  const predictedAmount = predictNextBill(historyAmounts);

  // Prepare Graph Data (Last 5 + Prediction)
  const graphData = [
    ...(billingData?.history
      ?.slice(0, 5)
      .reverse()
      .map((h: any, i: number) => ({
        name: `Month ${i + 1}`,
        cost: h.amount,
      })) || []),
    { name: "Next", cost: predictedAmount, isPrediction: true },
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 1. BALANCE CARD */}
        <BillingCard
          setIsTopUpOpen={setIsTopUpOpen}
          billingData={billingData}
        />

        {/* 2. PREDICTION CARD (ML Powered) */}
        <BillingChart
          historyAmounts={historyAmounts}
          graphData={graphData}
          predictedAmount={predictedAmount}
        />
      </div>

      {/* 3. HISTORY TABLE */}
      <BillingTable
        billingData={billingData}
        currentPage={billingData?.meta?.page || 1}
        totalPages={billingData?.meta?.totalPages || 1}
        onPageChange={(newPage: any) => setPage(newPage)}
      />

      {/* TOP-UP MODAL (Dialog) */}
      <BillingTopup
        user={user}
        isTopUpOpen={isTopUpOpen}
        setIsTopUpOpen={setIsTopUpOpen}
        outlets={outlets}
      />
    </div>
  );
}
