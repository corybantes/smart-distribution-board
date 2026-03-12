"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Cpu,
  Thermometer,
  Volume2,
  Clock,
  Loader2,
  Zap,
  Activity,
} from "lucide-react";

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

  const isAlarmActive = energyData?.buzzer === 1 || energyData?.buzzer === true;
  const currentTemp = energyData?.temperature || 0;

  return (
    <div className="px-4 lg:px-6 mt-6 space-y-6">
      {/* 1. SYSTEM TELEMETRY HEADER (Glassmorphism Style) */}
      {/* <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-1">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl bg-slate-900/90 px-6 py-4 backdrop-blur-md border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-500/20 p-2.5 text-blue-400">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Hardware Control Center
              </h3>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Clock size={12} /> Sync:{" "}
                {energyData?.timestamp
                  ? new Date(energyData.timestamp * 1000).toLocaleTimeString()
                  : "..."}
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              </p>
            </div>
          </div>

          {!isLoading && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-4 py-2 border border-slate-700">
                <Thermometer
                  size={18}
                  className={
                    currentTemp > 45 ? "text-red-400" : "text-emerald-400"
                  }
                />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">
                    Temp
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {currentTemp}°C
                  </span>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 rounded-lg px-4 py-2 border ${isAlarmActive ? "bg-red-500/10 border-red-500/50" : "bg-slate-800/50 border-slate-700"}`}
              >
                <Volume2
                  size={18}
                  className={
                    isAlarmActive
                      ? "text-red-400 animate-bounce"
                      : "text-slate-500"
                  }
                />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">
                    Buzzer
                  </span>
                  <span
                    className={`text-sm font-bold ${isAlarmActive ? "text-red-400" : "text-slate-400"}`}
                  >
                    {isAlarmActive ? "ALARM" : "SILENT"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div> */}

      {/* 2. OUTLET GRID (Modern Hardware Cards) */}
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
