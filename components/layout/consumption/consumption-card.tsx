import { DollarSign, Loader2, TrendingUp, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

export default function ConsumptionCard({
  startDate,
  endDate,
  totalUsage,
  isLoading,
  projectedBill,
  price,
  avgDaily,
}: {
  isLoading: boolean;
  price: number;
  startDate: string;
  endDate: string;
  totalUsage: number;
  avgDaily: number;
  projectedBill: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Usage */}
      <Card className=" @container/card bg-linear-to-br from-blue-600 to-blue-500 text-white border-none">
        <CardHeader className="">
          <CardTitle className="flex gap-4 text-blue-100 font-medium">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Zap size={24} />
            </div>
            Total Usage
          </CardTitle>
        </CardHeader>
        <CardContent className=" font-bold tracking-tight">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <div>
              <span className="text-3xl font-bold tracking-tight">
                {totalUsage.toFixed(1)}{" "}
              </span>
              <span className="text-lg font-normal opacity-70">kWh</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estimated Cost */}
      <Card className="bg-white dark:bg-slate-900">
        <CardHeader className="">
          <CardDescription className="flex gap-4">
            <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              <DollarSign size={24} />
            </div>

            <p className="text-muted-foreground font-medium">Estimated Cost</p>
          </CardDescription>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <CardTitle className="text-3xl font-bold tracking-tight">
              ₦{" "}
              {projectedBill.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
              <p className="text-[10px] text-muted-foreground mt-1 font-normal">
                Based on ₦{price}/kWh
              </p>
            </CardTitle>
          )}
        </CardHeader>
      </Card>

      {/* Average Usage */}
      <Card className="bg-white dark:bg-slate-900">
        <CardHeader className="">
          <CardDescription className="flex gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
              <TrendingUp size={24} />
            </div>
            <p className="text-muted-foreground font-medium">
              Avg. Daily Usage
            </p>
          </CardDescription>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <CardTitle className="text-3xl font-bold tracking-tight">
              {avgDaily.toFixed(1)}{" "}
              <span className="text-lg font-normal text-muted-foreground">
                kWh
              </span>
            </CardTitle>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
