import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function BillingCard({
  billingData,
  setIsTopUpOpen,
}: {
  billingData: any;
  setIsTopUpOpen: any;
}) {
  return (
    <div className="flex-1">
      <Card className="glass-card h-full bg-linear-to-r from-gray-900 to-slate-800 text-white border-none relative overflow-hidden p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                Wallet Balance
              </p>
              <h2 className="text-4xl font-bold mt-2">
                ₦ {billingData?.balance?.toLocaleString() || "0.00"}
              </h2>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unit Equivalent</span>
              <span className="font-bold">
                ~{(billingData?.balance / 100).toFixed(1)} kWh
              </span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              {/* Visual indicator of balance health */}
              <div
                className={`h-full w-[40%] ${
                  billingData?.balance < 1000 ? "bg-red-500" : "bg-green-500"
                }`}
              ></div>
            </div>
          </div>

          <Button
            onClick={() => setIsTopUpOpen(true)}
            className="mt-8 w-full bg-white text-black hover:bg-gray-200 font-bold h-12 text-lg"
          >
            <Plus className="mr-2 h-5 w-5" /> Top Up Balance
          </Button>
        </div>
      </Card>
    </div>
  );
}
