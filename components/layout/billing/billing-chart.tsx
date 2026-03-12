"use client";

import { TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader } from "../../ui/card";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  cost: {
    label: "Predicted Cost",
    color: "#8b5cf6", // Tailwind violet-500 for the AI aesthetic
  },
} satisfies ChartConfig;

export default function BillingChart({
  graphData,
  predictedAmount,
  historyAmounts,
}: {
  graphData: any[];
  predictedAmount: number;
  historyAmounts: any[];
}) {
  return (
    <div className="flex-1 w-full h-full">
      <Card className="shadow-sm border-border relative overflow-hidden flex flex-col h-full min-h-100">
        {/* Subtle AI/Prediction Glow Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

        <CardHeader className="pb-0 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-0">
            <div className="flex gap-3">
              <div className="p-2.5 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl h-fit">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  AI Bill Forecast
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  3-Month Weighted Average
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end">
              <Badge
                variant="outline"
                className="w-fit mb-1 border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300 font-bold uppercase tracking-widest text-[9px]"
              >
                Projected Next Month
              </Badge>
              <span className="text-3xl sm:text-4xl font-bold tracking-tighter text-foreground">
                ₦{Math.round(predictedAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* <p className="text-xs text-muted-foreground border-b pb-4">
            Forecast generated based on your historical usage trend (
            {historyAmounts?.length || 0} data points).
          </p> */}
        </CardHeader>

        <CardContent className="px-2 sm:px-6 pb-6 pt-4 flex-1 relative z-10">
          {graphData && graphData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-62.5 sm:h-75 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  accessibilityLayer
                  data={graphData}
                  margin={{
                    left: -10,
                    right: 10,
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
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs font-medium"
                    tickFormatter={(value) => {
                      if (value === "Next Month") return "Next";
                      return value;
                    }}
                  />

                  {/* FIX: Added proper Y-Axis with currency formatting */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={0}
                    width={80} // Wide enough to fit "₦ 10,000"
                    tickFormatter={(val) => `₦${val.toLocaleString()}`}
                    className="text-[10px] sm:text-xs font-medium text-muted-foreground"
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />

                  <Area
                    dataKey="cost"
                    type="monotone"
                    fill="url(#colorCost)" // Uses gradient defined below
                    fillOpacity={1}
                    stroke="#8b5cf6" // Violet-500
                    strokeWidth={2}
                  />

                  {/* Gradient Definition for a premium fade effect */}
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <TrendingUp className="h-10 w-10 mb-2" />
              <p className="text-sm">Not enough data to generate forecast.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
