"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Activity, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

export default function HardwareTenantWidget({
  outlet,
  userProfile,
  isLoading,
}: any) {
  const [isToggling, setIsToggling] = useState(false);

  if (!outlet) return null;
  const isOn = outlet.status === 1;

  const handleTogglePower = async (newCheckedState: boolean) => {
    setIsToggling(true);
    const action = newCheckedState ? "ON" : "OFF";

    try {
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          smartDbId: userProfile?.smartDbId,
          outletId: outlet.id,
          action: action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle power");
      }

      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 mt-6">
      <Card className="shadow-sm border-border overflow-hidden bg-linear-to-br from-card to-muted/20">
        <CardHeader className="border-b bg-card/50 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity size={20} className="text-primary" />
              Live Power Status
            </CardTitle>
            <CardDescription className="mt-1">
              Room:{" "}
              <span className="font-medium text-foreground">{outlet.name}</span>
            </CardDescription>
          </div>

          {/* Custom Embedded Text Switch */}
          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              disabled={isLoading || isToggling}
              onClick={() => handleTogglePower(!isOn)}
              className={`
                relative inline-flex h-9 w-24 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
                transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${isOn ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-slate-300 dark:bg-slate-700"}
                ${isLoading || isToggling ? "opacity-60 cursor-not-allowed" : ""}
              `}
            >
              <span className="sr-only">Toggle power</span>

              {/* ON Text */}
              <span
                className={`absolute left-2.5 text-[10px] font-bold tracking-wider text-white transition-opacity duration-300 ${isOn ? "opacity-100" : "opacity-0"}`}
              >
                ACTIVE
              </span>

              {/* OFF Text */}
              <span
                className={`absolute right-1.5 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 transition-opacity duration-300 ${!isOn ? "opacity-100" : "opacity-0"}`}
              >
                INACTIVE
              </span>

              {/* Sliding Thumb */}
              <span
                className={`
                  pointer-events-none flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out
                  ${isOn ? "translate-x-16" : "translate-x-0"}
                `}
              >
                {isToggling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : (
                  <Power
                    className={`h-3.5 w-3.5 ${isOn ? "text-green-500" : "text-slate-400"}`}
                  />
                )}
              </span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-widest mb-2">
                  Current Load
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-7xl font-bold font-mono tracking-tighter">
                    {outlet.power}
                  </span>
                  <span className="text-2xl text-muted-foreground">W</span>
                </div>
              </div>

              <div className="h-px w-full md:h-24 md:w-px bg-border" />

              <div className="flex w-full md:w-auto justify-around gap-12">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] uppercase text-muted-foreground font-semibold mb-1.5">
                    Voltage
                  </span>
                  <span className="text-3xl font-mono font-medium">
                    {outlet.voltage}V
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] uppercase text-muted-foreground font-semibold mb-1.5">
                    Current
                  </span>
                  <span className="text-3xl font-mono font-medium">
                    {outlet.current}A
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
