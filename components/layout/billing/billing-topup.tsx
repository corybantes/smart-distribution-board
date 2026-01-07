import { Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import useSWR, { mutate } from "swr";
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
  setIsTopUpOpen: any;
  outlets: any;
}) {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  // --- HANDLERS ---
  // 2. Fetch Outlets (For Dropdown)

  const handleTopUp = async () => {
    if (!topUpAmount || !selectedOutlet)
      return toast.error("Please fill all fields");

    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user?.uid,
          amount: topUpAmount,
          outletId: selectedOutlet,
        }),
      });

      if (!res.ok) throw new Error("Payment failed");

      toast.success("Top-up successful!");
      setIsTopUpOpen(false);
      setTopUpAmount("");
      mutate(`/api/billing?uid=${user?.uid}`); // Refresh Data
    } catch (error) {
      toast.error("Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Top Up Balance</DialogTitle>
          <DialogDescription>
            Purchase credits for a specific outlet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Select Outlet</Label>
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose device..." />
              </SelectTrigger>
              <SelectContent>
                {outlets?.map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              placeholder="0.00"
              className="text-lg font-bold"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1000, 5000, 10000].map((amt) => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                onClick={() => setTopUpAmount(amt.toString())}
              >
                ₦{amt.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleTopUp}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
