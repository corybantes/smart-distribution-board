import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EnergyApiResponse,
  fetcher,
  HistoryData,
  UserProfile,
} from "@/lib/utils";
import { Switch } from "../../ui/switch";
import WeatherCard from "./weather-card";
import { Activity, Lightbulb, Wallet, Zap } from "lucide-react";
import useSWR from "swr";

export default function DashboardCard({
  profile,
  energyData,
  user,
  totalCost,
  predictedCost,
  totalUsage,
}: {
  profile: UserProfile | undefined;
  energyData: EnergyApiResponse;
  user: any;
  totalCost: number;
  totalUsage: number;
  predictedCost: number;
}) {
  const toggleRelay = async (outletId: string, currentStatus: number) => {
    if (profile?.role !== "admin") return; // Tenants cannot control
    if (!user) return;

    // Determine new status (0 = Off, 1 = On)
    // If it's 2 (Tripped), maybe we allow reset to 0 (Off)
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      // Call your hypothetical control API
      await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          smartDbId: profile.smartDbId, // The board ID
          outletId: outletId,
          action: newStatus === 1 ? "ON" : "OFF",
        }),
      });
      // SWR will auto-update the UI when the next poll comes in (2s later)
      // Optimistic UI updates could be added here for instant feedback
    } catch (error) {
      console.error("Failed to toggle relay via API", error);
      alert("Failed to send command to device.");
    }
  };

  // --- Filtering Logic ---
  // If Tenant -> Only show assigned outlet. If Admin -> Show all.
  const visibleOutlets =
    energyData?.outlets.filter((outlet) => {
      if (profile?.role === "admin") return true;
      // For tenant, match the ID. Ensure types match (string vs number)
      return String(outlet.id) === String(profile?.outletId);
    }) || [];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <WeatherCard profile={profile} />
      <Card className=" @container/card ">
        <CardHeader className="">
          <CardTitle className="flex gap-4 font-medium items-center">
            <div className="p-3 bg-primary/20 rounded-full backdrop-blur-sm">
              <Zap size={24} />
            </div>
            Total Outlet Usage
          </CardTitle>
        </CardHeader>
        <CardContent className=" font-bold tracking-tight">
          {/* {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : */}
          {/* ( */}
          <div>
            <span className="text-3xl font-bold tracking-tight">
              {totalUsage.toFixed(1)}{" "}
            </span>
            <span className="text-lg font-normal opacity-70">kWh</span>
          </div>
          {/* ) */}
          {/* } */}
        </CardContent>
      </Card>
      <Card className=" @container/card ">
        <CardHeader className="">
          <CardTitle className="flex gap-4 font-medium items-center">
            <div className="p-3 bg-primary/20 rounded-full backdrop-blur-sm">
              <Wallet size={24} />
            </div>
            Total Estimated Cost
          </CardTitle>
        </CardHeader>
        <CardContent className=" font-bold tracking-tight">
          {/* {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : */}
          {/* ( */}
          <div>
            <span className="text-3xl font-bold tracking-tight">
              ₦ {totalCost.toFixed(1)}{" "}
            </span>
            {/* <span className="text-lg font-normal opacity-70">kWh</span> */}
          </div>
          {/* ) */}
          {/* } */}
        </CardContent>
      </Card>
      <Card className=" @container/card ">
        <CardHeader className="">
          <CardTitle className="flex gap-4 font-medium items-center">
            <div className="p-3 bg-primary/20 rounded-full backdrop-blur-sm">
              <Activity size={24} />
            </div>
            Predicted Cost
          </CardTitle>
        </CardHeader>
        <CardContent className=" font-bold tracking-tight">
          {/* {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : */}
          {/* ( */}
          <div>
            <span className="text-3xl font-bold tracking-tight">
              ₦ {predictedCost.toFixed(1)}{" "}
            </span>
            {/* <span className="text-lg font-normal opacity-70">kWh</span> */}
          </div>
          {/* ) */}
          {/* } */}
        </CardContent>
      </Card>
      {visibleOutlets.length > 0 ? (
        visibleOutlets.map((outlet) => {
          const isTripped = outlet.status === 2;
          const isOn = outlet.status === 1;
          const canControl = profile?.role === "admin"; // Tenants cannot see the switch
          return (
            <Card className="@container/card" key={outlet.id}>
              <CardHeader>
                <CardDescription className="flex gap-3 items-center">
                  <span
                    className={`p-3 rounded-full ${
                      isOn
                        ? "bg-green-100 text-green-600"
                        : isTripped
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Lightbulb />
                  </span>
                  {outlet.name}
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {outlet.power} W
                </CardTitle>
                <CardAction>
                  {canControl ? (
                    <Switch
                      checked={isOn}
                      disabled={isTripped} // Cannot turn on if tripped (requires reset)
                      onCheckedChange={() =>
                        toggleRelay(outlet.id, outlet.status)
                      }
                    />
                  ) : (
                    // Tenant Status Indicator
                    <div
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        isOn
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isOn ? "ON" : "OFF"}
                    </div>
                  )}
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                {/* <div className="line-clamp-1 flex gap-2 font-medium">
          Trending up this month <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">
          Visitors for the last 6 months
        </div> */}
                <div className="flex justify-between items-center text-xs text-muted-foreground font-mono gap-4">
                  <div className="flex flex-col gap-1">
                    <span>Voltage</span>
                    <span>{outlet.voltage}V</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Current</span>
                    <span>{outlet.current}A</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })
      ) : (
        // Empty State
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 p-8 text-center text-gray-500 border border-dashed rounded-xl">
          No active devices found.{" "}
          {profile?.role === "tenant"
            ? "Please contact your admin."
            : "Connect hardware."}
        </div>
      )}
    </div>
  );
}
