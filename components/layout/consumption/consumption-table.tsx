"use client";

import { format, parseISO, isValid } from "date-fns";
import { HistoryData } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServerPagination } from "@/components/layout/general/server-pagination";
import { Loader2, Zap, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableLoadingSkeleton } from "@/components/layout/general/Loading"; // <-- Import the skeleton!

interface ConsumptionTableProps {
  data: HistoryData[];
  price: number;
  loading: boolean;
  isAdmin?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ConsumptionTable({
  data,
  price,
  loading,
  isAdmin = false,
  currentPage,
  totalPages,
  onPageChange,
}: ConsumptionTableProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMM dd, yyyy • HH:mm") : dateString;
    } catch (e) {
      return dateString;
    }
  };

  // --- Helper to determine usage intensity ---
  const getUsageColor = (usage: number) => {
    if (usage > 5)
      return "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200"; // High spike
    if (usage > 1)
      return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200"; // Normal
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200"; // Low/Idle
  };

  // Check if it's the very first load (loading is true, but no data yet)
  const isInitialLoad = loading && (!data || data.length === 0);

  // Check if we are just switching pages (loading is true, but we already have old data on screen)
  const isPaginating = loading && data && data.length > 0;

  // Determine column count dynamically for the skeleton
  const columnCount = isAdmin ? 4 : 3;

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">
            Detailed Consumption Logs
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAdmin
              ? "Transaction history across all monitored outlets"
              : "Your personal energy transaction history"}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={18} className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Logs are aggregated based on your selected time range (Hourly or
              Daily).
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border border-border overflow-hidden relative min-h-75">
          {/* Overlay Spinner ONLY shows during pagination */}
          {isPaginating && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-55">Timestamp</TableHead>
                {isAdmin && <TableHead className="w-30">Source</TableHead>}
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Cost (₦)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialLoad ? (
                // --- SKELETON LOADING ROWS ---
                <TableLoadingSkeleton rows={5} columns={columnCount} />
              ) : data && data.length > 0 ? (
                // --- ACTUAL DATA ROWS ---
                data.map((item, index) => {
                  const usage = item.usage || 0;
                  const cost = usage * price;

                  return (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-sm whitespace-nowrap">
                        {formatDate(item.date)}
                      </TableCell>

                      {isAdmin && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono bg-background shadow-sm border-slate-300"
                          >
                            {item.outletId
                              ? `OUTLET_${item.outletId}`
                              : "BUILDING_TOTAL"}
                          </Badge>
                        </TableCell>
                      )}

                      <TableCell className="text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold">{usage.toFixed(4)}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            kWh
                          </span>
                          {/* Intensity Indicator */}
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${usage > 5 ? "bg-red-500 animate-pulse" : "bg-blue-500"}`}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        <div className="inline-flex items-center justify-end px-2.5 py-0.5 rounded-md border border-transparent font-bold text-sm">
                          {new Intl.NumberFormat("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(cost)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                // --- EMPTY STATE ---
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Zap size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-medium">
                        No activity recorded for this period.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pt-6 border-t mt-4">
          <ServerPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
