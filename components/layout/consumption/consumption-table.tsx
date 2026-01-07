"use client";

import { format, parseISO, isValid } from "date-fns";
import { HistoryData } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServerPagination } from "@/components/layout/general/server-pagination";
import { Loader2 } from "lucide-react";

interface ConsumptionTableProps {
  data: HistoryData[];
  price: number;
  loading: boolean;
  // Pagination Props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ConsumptionTable({
  data,
  price,
  loading,
  currentPage,
  totalPages,
  onPageChange,
}: ConsumptionTableProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMM dd, yyyy - HH:mm") : dateString;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border relative min-h-75">
          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="">Date</TableHead>
                <TableHead>Usage (kWh)</TableHead>
                <TableHead className="">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell>{item.usage?.toFixed(4) || "0.0000"}</TableCell>
                    <TableCell className="">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format((item.usage || 0) * price)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {!loading && "No records found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server Pagination Control */}
        <div className="pt-4">
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
