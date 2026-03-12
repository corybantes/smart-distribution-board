"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wallet, Zap } from "lucide-react";
import WeatherCard from "./weather-card";
import { UserProfile } from "@/lib/utils";

function CardLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-32 rounded bg-muted mt-1" />
      <div className="h-4 w-20 rounded bg-muted mt-2 opacity-70" />
    </div>
  );
}

export default function DashboardMetrics({
  profile,
  totalUsage,
  totalCost,
  predictedCost,
  isLoading,
  selectedRange, // <-- NEW PROP
}: {
  profile: UserProfile | undefined;
  totalUsage: number;
  totalCost: number;
  predictedCost: number;
  isLoading: boolean;
  selectedRange: any; // <-- NEW PROP
}) {
  const isAdmin = profile?.role === "admin";

  // Safely grab the label (e.g., "Today", "Last 7 Days")
  const rangeLabel = selectedRange?.label || "selected period";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 px-4 lg:px-6">
      <WeatherCard profile={profile} />

      {/* 1. Usage Card */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-md">
              <Zap size={16} />
            </div>
            {isAdmin ? "Building Usage" : "My Usage"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardLoadingSkeleton />
          ) : (
            <div>
              <span className="text-3xl font-bold tracking-tight">
                {totalUsage.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-muted-foreground ml-1">
                kWh
              </span>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                For {rangeLabel.toLowerCase()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Estimated Cost Card */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="p-1.5 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-md">
              <Wallet size={16} />
            </div>
            Estimated Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardLoadingSkeleton />
          ) : (
            <div>
              <span className="text-3xl font-bold tracking-tight">
                ₦
                {totalCost.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                For {rangeLabel.toLowerCase()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Predicted Bill Card */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="p-1.5 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-md">
              <Activity size={16} />
            </div>
            Predicted Bill
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardLoadingSkeleton />
          ) : (
            <div>
              <span className="text-3xl font-bold tracking-tight">
                ₦
                {predictedCost.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
              <p className="text-[11px] text-orange-600/80 dark:text-orange-400/80 mt-1.5 font-medium">
                Projected for current month
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
