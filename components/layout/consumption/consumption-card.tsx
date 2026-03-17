"use client";

import { DollarSign, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CardLoadingSkeleton } from "../general/Loading";
import { formatDateRange } from "@/lib/utils";

export default function ConsumptionCard({
  selectedRange,
  totalUsage,
  isLoading,
  projectedBill,
  price,
  avgDaily,
}: {
  isLoading: boolean;
  price: number;
  selectedRange: any;
  totalUsage: number;
  avgDaily: number;
  projectedBill: number;
}) {
  // --- SMART LABEL LOGIC ---
  const getContextLabel = () => {
    if (selectedRange?.value === "today") return "For Today";
    if (selectedRange?.value === "yesterday") return "For Yesterday";

    // Fallback to the human-readable date range for 7days, 30days, etc.
    return `Period: ${formatDateRange(selectedRange.startDate, selectedRange.endDate)}`;
  };

  const contextText = getContextLabel();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Total Usage Card */}
      <Card className="shadow-sm border-border overflow-hidden relative border-t-4 border-t-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
              <Zap size={18} />
            </div>
            Total Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardLoadingSkeleton />
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {totalUsage.toFixed(1)}
                </span>
                <span className="text-lg font-medium text-muted-foreground">
                  kWh
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-bold uppercase tracking-widest opacity-70">
                {contextText}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Estimated Cost Card */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
              <DollarSign size={18} />
            </div>
            Estimated Cost (₦{price}/kWh)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardLoadingSkeleton />
          ) : (
            <div>
              <span className="text-4xl font-bold tracking-tight">
                ₦
                {projectedBill.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
              <p className="text-[11px] text-muted-foreground mt-2 font-bold uppercase tracking-widest opacity-70">
                {contextText}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Average Daily Usage Card */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="p-2 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg">
              <TrendingUp size={18} />
            </div>
            Daily Average
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardLoadingSkeleton />
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {avgDaily.toFixed(1)}
                </span>
                <span className="text-lg font-medium text-muted-foreground">
                  kWh/day
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-bold uppercase tracking-widest opacity-70">
                Calculated over period
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
