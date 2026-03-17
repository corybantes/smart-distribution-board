"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Activity } from "lucide-react";

export default function HardwareAdminList({
  energyData,
  outlets,
  user,
  isLoading,
  profile,
}: any) {
  const toggleRelay = async (outletId: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          smartDbId: profile.smartDbId,
          outletId: outletId,
          action: newStatus === 1 ? "ON" : "OFF",
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

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
          : outlets.map((outlet: any) => {
              const isOn = outlet.status === 1;
              const isTripped = outlet.status === 2;

              return (
                <Card
                  key={outlet.id}
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${isOn ? "border-l-4 border-l-blue-500" : isTripped ? "border-l-4 border-l-red-500" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-bold tracking-tight">
                          {outlet.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${isOn ? "bg-blue-50 text-blue-700" : isTripped ? "bg-red-50 text-red-700" : "bg-slate-50"}`}
                        >
                          {isOn
                            ? "ACTIVE"
                            : isTripped
                              ? "SAFETY TRIP"
                              : "OFFLINE"}
                        </Badge>
                      </div>
                      <Switch
                        checked={isOn}
                        disabled={isTripped}
                        onCheckedChange={() =>
                          toggleRelay(outlet.id, outlet.status)
                        }
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
                        <span className="text-xs font-mono">
                          {outlet.voltage}V
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Activity size={14} className="text-slate-400" />
                        <span className="text-xs font-mono">
                          {outlet.current}A
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
