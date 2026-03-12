"use client";

import { CreditCard, Plus, Zap, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function BillingCard({
  billingData,
  setIsTopUpOpen,
  user,
  pricePerKwh,
}: {
  billingData: any;
  setIsTopUpOpen: (open: boolean) => void;
  user: any;
  pricePerKwh: number;
}) {
  const balance = billingData?.balance || 0;
  const isAdmin = user?.role === "admin";

  // Health calculation: Let's make 10,000 NGN the 'Full' mark for the visual bar
  const healthPercentage = Math.min(100, Math.max(5, (balance / 10000) * 100));
  const isLowBalance = balance < 1000;

  return (
    <div className="flex border w-full">
      <Card className="relative overflow-hidden bg-slate-950 border-none shadow-2xl min-h-80 flex flex-col justify-between p-6 sm:p-8 w-full">
        {/* Background Visual Flair: Animated Blue Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-400/80">
                <Wallet size={16} />
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">
                  Current Balance
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-white text-4xl sm:text-5xl font-bold tracking-tighter">
                  ₦
                  {balance.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-inner">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Unit Equivalent Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Estimated Units
                </p>
                <div className="flex items-center gap-2 text-white font-mono text-xl font-bold">
                  <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                  {(balance / pricePerKwh).toFixed(1)}{" "}
                  <span className="text-sm font-sans font-normal text-slate-400">
                    kWh
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded ${isLowBalance ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
              >
                {isLowBalance ? "LOW BALANCE" : "HEALTHY"}
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="relative w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] ${
                  isLowBalance
                    ? "bg-linear-to-r from-red-600 to-red-400"
                    : "bg-linear-to-r from-blue-600 to-emerald-400"
                }`}
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Button: Exclusive to Admin */}
        {isAdmin ? (
          <Button
            onClick={() => setIsTopUpOpen(true)}
            className="relative z-10 mt-8 w-full bg-white text-slate-950 hover:bg-blue-50 transition-all font-bold h-14 rounded-2xl text-base shadow-[0_10px_20px_rgba(255,255,255,0.1)] group"
          >
            <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
            Allocate Credits
          </Button>
        ) : (
          <div className="mt-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
            <p className="text-[11px] text-slate-400 text-center italic">
              Please contact your administrator to request a balance top-up.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
