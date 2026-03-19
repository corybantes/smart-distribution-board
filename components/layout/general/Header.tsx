"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "../../ui/sidebar";
import { NotificationSheet } from "../../notifications/NotificationSheet";
import { Separator } from "../../ui/separator";
import {
  Thermometer,
  Volume2,
  Wifi,
  WifiOff,
  Activity,
  Clock,
} from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { fetcher, EnergyApiResponse } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // <-- Added Popover for mobile touch
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const path = pathname.split("/").pop();

  // 1. Fetch Real-time System Data for the Header
  const { data: energyData } = useSWR<EnergyApiResponse>(
    user ? `/api/energy?uid=${user.uid}` : null,
    fetcher,
    { refreshInterval: 5000 },
  );

  const { data: profile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  const uuidRegex = /^[0-9a-zA-Z]{28}$/;
  const isUUID = uuidRegex.test(path ?? "");
  const items = [
    { title: "Dashboard", path: "dashboard" },
    { title: "Consumption Analytics", path: "consumption" },
    { title: "Billing", path: "billing" },
    { title: "System Operation", path: "settings" },
  ];

  const displayMessage = isUUID ? "dashboard" : path;
  const isAdmin = profile?.role === "admin";

  // --- SYSTEM LOGIC ---
  const isOnline = energyData?.timestamp
    ? Math.floor(Date.now() / 1000) - energyData.timestamp < 30
    : false;

  const isAlarmActive = energyData?.buzzer === 1;

  // Format the last sync time
  const lastSyncDate = energyData?.timestamp
    ? new Date(energyData.timestamp * 1000)
    : null;
  const lastSyncText = lastSyncDate
    ? lastSyncDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Never";

  return (
    <div className="w-full pl-6 px-5 py-2 md:px-6 md:py-3 flex justify-between items-center z-50 bg-white/70 dark:bg-black/70 backdrop-blur-lg border-b border-gray-200 dark:border-white/10 sticky top-0">
      <div className="flex items-center gap-2 font-semibold text-[16px] md:text-lg">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4 mx-1" />
        {items.map((item) => (
          <div key={item.title}>
            {displayMessage === item.path && (
              <span className="truncate">{item.title}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {/* --- DESKTOP STATUS BAR (Visible on lg screens) --- */}
        <TooltipProvider>
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
            {/* Online/Offline Status (For BOTH Admin & Tenant) */}
            <Tooltip>
              <TooltipTrigger
                className={`flex items-center gap-1.5 px-2 ${isAdmin ? "border-r border-gray-300 dark:border-white/10" : ""}`}
              >
                {isOnline ? (
                  <Wifi size={14} className="text-emerald-500" />
                ) : (
                  <WifiOff size={14} className="text-red-500" />
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-tighter ${isOnline ? "text-emerald-600" : "text-red-600"}`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-center">
                <p className="font-semibold mb-1">Hardware Connection</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock size={12} /> Last Sync: {lastSyncText}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Admin-Only Metrics */}
            {isAdmin && (
              <>
                {/* Temperature */}
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1.5 px-2 border-r border-gray-300 dark:border-white/10">
                    <Thermometer
                      size={14}
                      className={
                        energyData?.temperature && energyData.temperature > 45
                          ? "text-orange-500"
                          : "text-muted-foreground"
                      }
                    />
                    <span className="text-[10px] font-mono font-bold tracking-tighter">
                      {energyData?.temperature ?? "--"}°C
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Board Temperature</TooltipContent>
                </Tooltip>

                {/* Buzzer Status */}
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1.5 px-2">
                    <Volume2
                      size={14}
                      className={
                        isAlarmActive
                          ? "text-red-500 animate-pulse"
                          : "text-muted-foreground"
                      }
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-tighter ${isAlarmActive ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {isAlarmActive ? "Alarm" : "Quiet"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>System Buzzer</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>

        {/* --- MOBILE STATUS POPOVER (Visible on small screens) --- */}
        <div className="flex lg:hidden items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full relative"
              >
                <Activity
                  size={18}
                  className={
                    isOnline ? "text-emerald-500" : "text-muted-foreground"
                  }
                />
                {/* Tiny indicator dot for offline or alarm */}
                {(!isOnline || isAlarmActive) && (
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${!isOnline ? "bg-red-500" : "bg-orange-500"}`}
                  ></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4 mr-4" align="end">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  System Health
                </h4>

                {/* Connection Status */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Connection
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <Wifi size={14} className="text-emerald-500" />
                    ) : (
                      <WifiOff size={14} className="text-red-500" />
                    )}
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${isOnline ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                {/* Last Sync */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Last Sync
                  </span>
                  <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                    {lastSyncText}
                  </span>
                </div>

                {/* Admin-Only Metrics */}
                {isAdmin && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">
                        Temperature
                      </span>
                      <div className="flex items-center gap-1">
                        <Thermometer
                          size={14}
                          className={
                            energyData?.temperature &&
                            energyData.temperature > 45
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          }
                        />
                        <span className="font-mono text-xs font-bold">
                          {energyData?.temperature ?? "--"}°C
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">
                        Buzzer
                      </span>
                      <div className="flex items-center gap-1">
                        <Volume2
                          size={14}
                          className={
                            isAlarmActive
                              ? "text-red-500 animate-pulse"
                              : "text-muted-foreground"
                          }
                        />
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${isAlarmActive ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          {isAlarmActive ? "Alarm" : "Quiet"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <NotificationSheet />
        </div>
      </div>
    </div>
  );
}
