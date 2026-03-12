"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { ArrowUpDown, Calendar, Gauge, Loader2, Power } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { HistoryData } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useState } from "react";
import { format, parseISO } from "date-fns";

export default function ConsumptionChart({
  isLoading,
  historyData = [],
  selectedRange,
}: {
  isLoading: boolean;
  historyData: HistoryData[] | undefined;
  selectedRange: any;
}) {
  const [metrics, setMetrics] = useState<string>("power");

  // --- SMART DATE FORMATTER ---
  // If the range is <= 24 hours (e.g., 'today', 'yesterday'), show Hours (14:00)
  // If > 24 hours (e.g., '7days', 'this_month'), show Days (Mar 10)
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

  const metricItems = [
    {
      label: "Power (Watts)",
      icon: Power,
      value: "power",
      dataKey: "realPower",
      unit: "W",
      color: "var(--color-power)",
    },
    {
      label: "Voltage (Volts)",
      icon: Gauge,
      value: "voltage",
      dataKey: "voltage",
      unit: "V",
      color: "var(--color-voltage)",
    },
    {
      label: "Current (Amps)",
      icon: ArrowUpDown,
      value: "current",
      dataKey: "current",
      unit: "A",
      color: "var(--color-current)",
    },
  ];

  const chartConfig = {
    usage: { label: "Energy (kWh)", color: "#3b82f6" }, // Blue
    power: { label: "Real Power", color: "#f59e0b" }, // Orange
    reactive: { label: "Reactive Power", color: "#ef4444" }, // Red
    voltage: { label: "Voltage", color: "#8b5cf6" }, // Purple
    current: { label: "Current", color: "#10b981" }, // Green
  } satisfies ChartConfig;

  // Find the currently selected metric configuration
  const activeMetric =
    metricItems.find((m) => m.value === metrics) || metricItems[0];

  return (
    <>
      {/* 1. ENERGY CONSUMPTION CHART (kWh) */}
      <Card className="flex flex-col">
        <CardHeader className="flex justify-between items-center mb-2 pb-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Energy Consumption
          </h2>
        </CardHeader>
        <CardContent className="flex-1 w-full pt-4">
          {isLoading ? (
            <div className="h-75 w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-75 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historyData}
                  margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />

                  {/* FIX: Formatted X-Axis */}
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={formatXAxis}
                    className="text-xs"
                  />

                  {/* FIX: Added Y-Axis with units */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(val) => `${val} kWh`}
                    width={65}
                    className="text-xs font-medium"
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    name="Energy"
                    dataKey="usage"
                    type="monotone"
                    fill="var(--color-usage)"
                    fillOpacity={0.2}
                    stroke="var(--color-usage)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* 2. REAL-TIME METRICS CHART (V, I, P) */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row justify-between items-center mb-2 pb-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <activeMetric.icon size={18} className="text-primary" />
            Live Metrics
          </h2>
          <Select value={metrics} onValueChange={setMetrics}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-900">
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
        <CardContent className="flex-1 w-full pt-4">
          {isLoading ? (
            <div className="h-75 w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-75 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historyData}
                  margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
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
                    tickFormatter={(val) => `${val} ${activeMetric.unit}`}
                    width={65}
                    className="text-xs font-medium"
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />

                  <Area
                    name={activeMetric.label.split(" ")[0]}
                    dataKey={activeMetric.dataKey}
                    type="monotone"
                    fill={activeMetric.color}
                    fillOpacity={0.2}
                    stroke={activeMetric.color}
                    strokeWidth={2}
                  />

                  {/* Render Reactive Power only if Power is selected */}
                  {metrics === "power" && (
                    <Area
                      name="Reactive"
                      dataKey="reactivePower"
                      type="monotone"
                      fill="var(--color-reactive)"
                      fillOpacity={0.1}
                      stroke="var(--color-reactive)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}
