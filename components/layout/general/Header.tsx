"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "../../ui/sidebar";
import { NotificationSheet } from "../../notifications/NotificationSheet";
import { Separator } from "../../ui/separator";
import { Thermometer, Volume2, Wifi, WifiOff } from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { fetcher, EnergyApiResponse } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const path = pathname.split("/").pop();

  // 1. Fetch Real-time System Data for the Header
  const { data: energyData } = useSWR<EnergyApiResponse>(
    user ? `/api/energy?uid=${user.uid}` : null,
    fetcher,
    { refreshInterval: 5000 }, // Slightly slower poll for the header to save resources
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

  // Connection Logic: If last update was > 30s ago, consider it offline
  const isOnline = energyData?.timestamp
    ? Math.floor(Date.now() / 1000) - energyData.timestamp < 30
    : false;

  const isAlarmActive = energyData?.buzzer === 1;

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
        {/* --- SYSTEM STATUS BAR (Admin Only) --- */}
        {isAdmin && (
          <TooltipProvider>
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
              {/* Online/Offline Status */}
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1.5 px-2 border-r border-gray-300 dark:border-white/10">
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
                <TooltipContent>Hardware Connection</TooltipContent>
              </Tooltip>

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
            </div>
          </TooltipProvider>
        )}

        <div className="flex items-center gap-2">
          <ModeToggle />
          <NotificationSheet />
        </div>
      </div>
    </div>
  );
}
