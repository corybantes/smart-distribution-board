import { XAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { ArrowUpDown, Calendar, Gauge, Loader2, Power } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  fillDataGaps,
  fillDataGapsNew,
  HistoryChartData,
  HistoryData,
} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useState } from "react";

export default function ConsumptionChart({
  isLoading,
  historyData,
  selectedRange,
}: {
  isLoading: boolean;
  historyData: HistoryData[] | undefined;
  selectedRange: any;
}) {
  const [metrics, setMetrics] = useState<string>("power");
  const metricItems = [
    {
      label: "Power",
      icon: Power,
      value: "power",
      data: historyData,
      dataKey: "realPower",
    },
    {
      label: "Voltage",
      icon: Gauge,
      value: "voltage",
      data: historyData,
      dataKey: "voltage",
    },
    {
      label: "Current",
      icon: ArrowUpDown,
      value: "current",
      data: historyData,
      dataKey: "current",
    },
  ];
  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-1)",
    },
    mobile: {
      label: "Mobile",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;
  return (
    <>
      <Card className="h-112.5 flex flex-col">
        <CardHeader className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Consumption History
          </h2>
          {/* <Button variant="outline" size="sm" className="hidden md:flex">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button> */}
        </CardHeader>
        <CardContent className="flex-1 w-full min-h-0">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-75 w-full"
            >
              <AreaChart
                accessibilityLayer
                data={fillDataGapsNew(
                  historyData || [],
                  selectedRange.value,
                  selectedRange.startDate,
                  selectedRange.endDate
                )}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Area
                  dataKey="usage"
                  type="linear"
                  fill="var(--color-desktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      <Card className="h-112.5 flex flex-col">
        <CardHeader className="flex justify-between items-center mb-6">
          {metricItems.map(
            (item) =>
              item.value === metrics && (
                <h2
                  className="text-lg font-bold flex items-center gap-2"
                  key={item.value}
                >
                  <item.icon size={18} className="text-primary" />
                  {item.label}
                </h2>
              )
          )}
          {/* <Button variant="outline" size="sm" className="hidden md:flex">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button> */}
          <Select value={metrics} onValueChange={setMetrics}>
            <SelectTrigger className="w-45 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              {metricItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 w-full min-h-0">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            metricItems.map(
              (item) =>
                item.value === metrics && (
                  <ChartContainer
                    key={item.value}
                    config={chartConfig}
                    className="aspect-auto h-75 w-full"
                  >
                    <AreaChart
                      accessibilityLayer
                      data={fillDataGaps(
                        item.data || [],
                        selectedRange.value,
                        selectedRange.startDate,
                        selectedRange.endDate
                      )}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent indicator="dot" hideLabel />
                        }
                      />
                      <Area
                        dataKey={item.dataKey}
                        type="linear"
                        fill="var(--color-desktop)"
                        fillOpacity={0.4}
                        stroke="var(--color-desktop)"
                      />
                      {item.value === "power" && (
                        <Area
                          dataKey="reactivePower"
                          type="linear"
                          fill="var(--color-mobile)"
                          fillOpacity={0.4}
                          stroke="var(--color-mobile)"
                        />
                      )}
                    </AreaChart>
                  </ChartContainer>
                )
            )
          )}
        </CardContent>
      </Card>
    </>
  );
}
