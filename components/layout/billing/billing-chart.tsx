import { TrendingUp } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export default function BillingChart({
  graphData,
  predictedAmount,
  historyAmounts,
}: {
  graphData: any;
  predictedAmount: number;
  historyAmounts: any;
}) {
  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--color-purple-600)",
    },
  } satisfies ChartConfig;
  return (
    <div className="flex-1">
      <Card className="@container/card flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-bold">AI Bill Forecast</h3>
              <p className="text-xs text-gray-500">Linear Regression Model</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold">
              ₦ {Math.round(predictedAmount).toLocaleString()}
            </span>
            <Badge
              variant="outline"
              className="mb-1 border-purple-200 text-purple-600 bg-purple-50"
            >
              Next Month
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Estimated based on your historical usage trend (
            {historyAmounts.length} data points).
          </p>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {/* <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none" }}
                formatter={(value: any) => [`₦${value}`, "Cost"]}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#9333ea"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
            </AreaChart>
          </ResponsiveContainer> */}
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart
              accessibilityLayer
              data={graphData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={"cost"}
                type="natural"
                fill="var(--color-desktop)"
                fillOpacity={0.4}
                stroke="var(--color-desktop)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
