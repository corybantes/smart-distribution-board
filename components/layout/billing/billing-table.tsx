import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Download, History } from "lucide-react";
import { Button } from "../../ui/button";
import { ServerPagination } from "../general/server-pagination";

export default function BillingTable({
  billingData,
  onPageChange,
  currentPage,
  totalPages,
}: {
  billingData: any;
  onPageChange: any;
  currentPage: any;
  totalPages: any;
}) {
  return (
    <Card className="p-6">
      <CardHeader className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <History className="text-gray-500" /> Transaction History
        </h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </CardHeader>

      <CardContent>
        <Table className="rounded-2xl border">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingData?.history?.map((bill: any) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.date}</TableCell>
                <TableCell>
                  Credits Purchase
                  <div className="text-[10px] text-gray-500">
                    Outlet ID: {bill.outletId || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 hover:bg-green-100"
                  >
                    {bill.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">
                  ₦ {bill.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {(!billingData?.history || billingData.history.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-gray-500"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <ServerPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </CardFooter>
    </Card>
  );
}
