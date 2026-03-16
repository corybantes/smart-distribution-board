"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react"; // <-- Added Loader2
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function BillingAdminChart({
  outlets,
  isLoading, // <-- Added loading prop
}: {
  outlets: any[];
  isLoading?: boolean;
}) {
  // Format the outlets data for the Recharts BarChart
  const chartData = (outlets || []).map((outlet) => ({
    name: `O${outlet.id} (${outlet.tenantName?.split(" ")[0] || "Vacant"})`,
    balance: outlet.tenantBalance || 0,
    isLow: (outlet.tenantBalance || 0) < 1000, // Flag low balances for red coloring
  }));

  const chartConfig = {
    balance: {
      label: "Wallet Balance (₦)",
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-sm border-border flex flex-col w-full h-full min-h-80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-sm text-muted-foreground font-medium uppercase tracking-wider">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-md">
            <Users size={16} />
          </div>
          Tenant Wallet Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pt-4">
        {isLoading ? (
          // --- LOADING STATE ---
          <div className="h-full w-full min-h-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          // --- EMPTY STATE (Updated to match other charts) ---
          <div className="h-full w-full min-h-50 flex flex-col items-center justify-center text-muted-foreground rounded-lg border-2 border-dashed border-muted bg-muted/10 p-6">
            <Users className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No active tenants found</p>
            <p className="text-xs opacity-70 mt-1">
              Configure outlets to see tenant balances.
            </p>
          </div>
        ) : (
          // --- ACTUAL CHART ---
          <ChartContainer
            config={chartConfig}
            className="h-full w-full min-h-50"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₦${value.toLocaleString()}`}
                  fontSize={12}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      // Colors low balances red, healthy balances primary blue
                      fill={entry.isLow ? "#ef4444" : "var(--color-primary)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
