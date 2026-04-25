"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Activity } from "lucide-react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

// --- ISOLATED OUTLET CARD COMPONENT ---
// We isolate this so each card manages its own loading state and prevents the "snap-back" effect.
function AdminOutletCard({ outlet, profile }: { outlet: any; profile: any }) {
  const [isToggling, setIsToggling] = useState(false);

  // Optimistic UI state
  const [optimisticStatus, setOptimisticStatus] = useState(outlet.status);

  // Sync with the live SWR data UNLESS we are currently in the middle of toggling
  useEffect(() => {
    if (!isToggling) {
      setOptimisticStatus(outlet.status);
    }
  }, [outlet.status, isToggling]);

  const isOn = optimisticStatus === 1;
  const isTripped = optimisticStatus === 2; // Follows the ESP32 safety trip logic

  const toggleRelay = async (checked: boolean) => {
    setIsToggling(true);
    setOptimisticStatus(checked ? 1 : 0); // Instantly update UI

    try {
      // 1. Grab secure token
      const token = await auth.currentUser?.getIdToken();

      // 2. Send command to secure API
      const res = await fetch("/api/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          smartDbId: profile.smartDbId,
          outletId: outlet.id,
          action: checked ? "ON" : "OFF",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to toggle");
      }
    } catch (e: any) {
      console.error(e);
      setOptimisticStatus(outlet.status); // Revert switch if it failed
      toast.error(`Failed to toggle ${outlet.name}: ${e.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isOn
          ? "border-l-4 border-l-blue-500"
          : isTripped
            ? "border-l-4 border-l-red-500"
            : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold tracking-tight">
              {outlet.name}
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold ${
                isOn
                  ? "bg-blue-50 text-blue-700"
                  : isTripped
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-50"
              }`}
            >
              {isOn ? "ACTIVE" : isTripped ? "SAFETY TRIP" : "OFFLINE"}
            </Badge>
          </div>
          <Switch
            checked={isOn}
            disabled={isTripped || isToggling} // Disable while toggling or tripped
            onCheckedChange={toggleRelay}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Live Load
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold tracking-tighter">
                {outlet.power}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                W
              </span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
            <Zap size={20} fill={isOn ? "currentColor" : "none"} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-slate-400" />
            <span className="text-xs font-mono">{outlet.voltage}V</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Activity size={14} className="text-slate-400" />
            <span className="text-xs font-mono">{outlet.current}A</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- MAIN EXPORT COMPONENT ---
export default function HardwareAdminList({
  energyData,
  outlets,
  user,
  isLoading,
  profile,
}: any) {
  return (
    <div className="px-4 lg:px-6 mt-6 space-y-6">
      {/* OUTLET GRID (Modern Hardware Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-xl bg-muted"
                />
              ))
          : outlets.map((outlet: any) => (
              <AdminOutletCard
                key={outlet.id}
                outlet={outlet}
                profile={profile}
              />
            ))}
      </div>
    </div>
  );
}
