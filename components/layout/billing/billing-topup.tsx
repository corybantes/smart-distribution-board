"use client";

import { Loader2, Wallet, Zap, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "../../ui/button";
import { mutate } from "swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useState } from "react";
import { toast } from "sonner";

export default function BillingTopup({
  user,
  isTopUpOpen,
  setIsTopUpOpen,
  outlets,
}: {
  user: any;
  isTopUpOpen: boolean;
  setIsTopUpOpen: (open: boolean) => void;
  outlets: any[];
}) {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopUp = async () => {
    if (!topUpAmount || !selectedOutlet) {
      return toast.error("Please select an outlet and enter an amount.");
    }

    setIsProcessing(true);
    try {
      const targetOutlet = outlets.find(
        (o) => o.id.toString() === selectedOutlet,
      );

      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user?.uid,
          outletId: selectedOutlet,
          // FIX 1: We send the email since we know the outlet has it, letting backend find the user
          targetEmail: targetOutlet?.assignedEmail,
          // FIX 2: Force the amount to be a clean Number, not a String
          amount: Number(topUpAmount),
        }),
      });

      // FIX 3: Actually read the error from the backend so we know WHY it failed
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Payment processing failed");
      }

      toast.success("Allocation successful! Credits have been applied.");
      setIsTopUpOpen(false);

      // Reset state for next time
      setTopUpAmount("");
      setSelectedOutlet("");

      // Refresh data
      mutate(
        (key: any) =>
          typeof key === "string" &&
          key.startsWith(`/api/billing/table?uid=${user?.uid}`),
      );
      mutate(`/api/billing?uid=${user?.uid}`);
    } catch (error: any) {
      console.error("Top-up Error:", error);
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
      <DialogContent className="sm:max-w-106.25 p-0 overflow-hidden border-none shadow-2xl">
        {/* Sleek FinTech Header */}
        <div className="bg-slate-950 px-6 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-white text-2xl flex items-center gap-2">
              <Wallet className="text-blue-400" />
              Allocate Credits
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Transfer funds to a specific hardware endpoint.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6 space-y-6 bg-background">
          {/* Target Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Target Endpoint
            </Label>
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
              <SelectTrigger className="w-full h-12 bg-muted/50 border-muted-foreground/20">
                <SelectValue placeholder="Choose a hardware endpoint..." />
              </SelectTrigger>
              <SelectContent>
                {outlets?.map((o: any) => (
                  <SelectItem key={o.id} value={o.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-blue-500" />
                      <span className="font-semibold">{o.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        (O{o.id})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Allocation Amount
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="text-2xl font-bold text-muted-foreground">
                  ₦
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                className="pl-12 h-16 text-3xl font-bold font-mono bg-muted/20 border-muted-foreground/30 focus-visible:ring-blue-500"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[1000, 5000, 10000].map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                className={`h-12 font-bold font-mono transition-all ${
                  topUpAmount === amt.toString()
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-muted-foreground/20 hover:border-blue-300"
                }`}
                onClick={() => setTopUpAmount(amt.toString())}
              >
                ₦{amt.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="bg-muted/30 px-6 py-4 border-t">
          <Button
            onClick={handleTopUp}
            disabled={isProcessing}
            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? "Processing Transfer..." : "Confirm Allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
