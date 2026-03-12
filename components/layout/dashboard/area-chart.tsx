"use client";

import { Calendar, Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export function ChartAreaDefault({
  chartTitle,
  chartDescription,
  chartConfig,
  chartData,
  dataKey,
  selectedRange,
  isLoading,
}: {
  chartTitle: string;
  chartDescription: string;
  chartConfig: ChartConfig;
  chartData: any[];
  dataKey: string;
  selectedRange: any;
  isLoading?: boolean;
}) {
  // --- SMART X-AXIS FORMATTER ---
  const formatXAxis = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const date = parseISO(dateStr);
      const isDaily = ["today", "yesterday"].includes(selectedRange?.value);
      return format(date, isDaily ? "HH:mm" : "MMM dd");
    } catch {
      return "";
    }
  };

  return (
    <Card className="flex flex-col border-border shadow-sm w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          {chartTitle}
        </CardTitle>
        <CardDescription>{chartDescription}</CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-6 flex-1">
        {isLoading ? (
          <div className="h-62.5 sm:h-75 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 sm:h-75 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: -0,
                  right: 12,
                  top: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={formatXAxis}
                  className="text-xs"
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(val) => `${val} kWh`}
                  width={65}
                  className="text-[10px] sm:text-xs font-medium"
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />

                {/* Clean, standard blue matching the Consumption page */}
                <Area
                  name="Energy"
                  dataKey={dataKey}
                  type="monotone"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-62.5 sm:h-75 w-full flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">No usage data found for this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
