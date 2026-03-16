"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText,
} from "lucide-react";
import { Button } from "../../ui/button";
import { ServerPagination } from "../general/server-pagination";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { TableLoadingSkeleton } from "../general/Loading"; // <-- Imported reusable skeleton

export default function BillingTable({
  uid,
  billingData,
  onPageChange,
  currentPage,
  totalPages,
  loading,
}: {
  uid: string;
  billingData: any[];
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  loading?: boolean;
}) {
  const [isExporting, setIsExporting] = useState(false);

  // Synchronized Date Formatting to match ConsumptionTable
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMM dd, yyyy • HH:mm") : dateString;
    } catch (e) {
      return dateString;
    }
  };

  const handleExport = async () => {
    if (!uid) return;
    setIsExporting(true);

    // Optional: Show a loading toast while generating a large CSV
    const toastId = toast.loading("Preparing your export...");

    try {
      const res = await fetch(
        `/api/billing/table?uid=${uid}&page=1&limit=5000`,
      );
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        toast.dismiss(toastId);
        toast.error("No data available to export.");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Date,Room / Outlet,Description,Type,Status,Amount (NGN)\n";

      json.data.forEach((row: any) => {
        const description =
          row.type === "usage" ? "Energy Consumption" : "Wallet Top-up";
        const typeStr = row.type === "usage" ? "Debit" : "Credit";
        const outletLabel = row.outletId ? `Outlet O${row.outletId}` : "N/A";
        const csvRow = `"${row.date}","${outletLabel}","${description}","${typeStr}","${row.status}","${Math.abs(row.amount)}"`;
        csvContent += csvRow + "\n";
      });

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute(
        "download",
        `Billing_Ledger_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Trigger Success Toast!
      toast.dismiss(toastId);
      toast.success("Export Successful! Your ledger has been downloaded.");
    } catch (error) {
      console.error("Export failed", error);
      toast.dismiss(toastId);
      toast.error("An error occurred while generating your CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  // Check if it's the very first load (loading is true, but no data yet)
  const isInitialLoad = loading && (!billingData || billingData.length === 0);

  // Check if we are just switching pages (loading is true, but we already have old data on screen)
  const isPaginating = loading && billingData && billingData.length > 0;

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Transaction Ledger
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Detailed history of all credits and consumption debits
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-background shadow-xs hover:bg-blue-50 hover:text-blue-600 transition-colors"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isExporting ? "Preparing..." : "Export"}
          </span>
        </Button>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border border-border overflow-hidden relative min-h-75">
          {/* Overlay Spinner ONLY shows during pagination so the table doesn't disappear */}
          {isPaginating && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-55">Timestamp</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (₦)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isInitialLoad ? (
                // --- REUSABLE SKELETON COMPONENT ---
                <TableLoadingSkeleton rows={5} columns={4} />
              ) : billingData && billingData.length > 0 ? (
                // --- ACTUAL DATA ROWS ---
                billingData.map((bill: any) => {
                  const isDeduction = bill.type === "usage" || bill.amount < 0;

                  return (
                    <TableRow
                      key={bill.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <TableCell className="font-medium text-sm whitespace-nowrap">
                        {formatDate(bill.date)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isDeduction
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                                : "bg-green-50 text-green-600 dark:bg-green-900/20"
                            }`}
                          >
                            {isDeduction ? (
                              <ArrowUpRight size={16} />
                            ) : (
                              <ArrowDownLeft size={16} />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {isDeduction
                                ? "Energy Consumption"
                                : "Wallet Top-up"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                              <ReceiptText size={10} />
                              {isDeduction
                                ? `OUTLET_${bill.outletId || "N/A"} • ${bill.userName || ""}`
                                : `ACCOUNT_CREDIT • ${bill.userName || ""}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDeduction
                              ? "border-red-200 bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : "border-green-200 bg-green-50/50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          }`}
                        >
                          {bill.status.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        <div
                          className={`inline-flex items-center justify-end px-2.5 py-0.5 rounded-md font-bold text-sm ${
                            isDeduction
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isDeduction ? "-" : "+"}
                          {new Intl.NumberFormat("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Math.abs(bill.amount))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                // --- EMPTY STATE ---
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <History size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-medium">
                        No transactions found for this period.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Synchronized Pagination Footer */}
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
