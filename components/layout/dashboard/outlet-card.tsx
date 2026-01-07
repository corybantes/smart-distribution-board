import { AlertTriangle, Fan, Lightbulb, Tv } from "lucide-react";
import { Card } from "../../ui/card";
import { Switch } from "../../ui/switch";
import { EnergyApiResponse, UserProfile } from "@/lib/utils";

export default function OutletCard({
  profile,
  energyData,
  user,
}: {
  profile: UserProfile | undefined;
  energyData: EnergyApiResponse;
  user: any;
}) {
  // 5. Control Logic (API Call)
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
  // Icons Helper
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tv")) return <Tv size={24} />;
    if (lower.includes("ac") || lower.includes("fan")) return <Fan size={24} />;
    return <Lightbulb size={24} />;
  };
  return visibleOutlets.length > 0 ? (
    visibleOutlets.map((outlet) => {
      const isTripped = outlet.status === 2;
      const isOn = outlet.status === 1;
      const canControl = profile?.role === "admin"; // Tenants cannot see the switch
      return (
        <Card
          key={outlet.id}
          className={`col-span-1 flex p-6 flex-col justify-between relative overflow-hidden ${
            isTripped ? "border-red-500 border-2" : ""
          }`}
        >
          {/* Overload Banner */}
          {isTripped && (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-2 py-1 rounded-bl font-bold flex items-center gap-1 z-10">
              <AlertTriangle size={10} /> TRIPPED
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <span
              className={`p-3 rounded-full ${
                isOn
                  ? "bg-green-100 text-green-600"
                  : isTripped
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {getIcon(outlet.name)}
            </span>
            {/* Control Switch (Admin Only) */}
            {canControl ? (
              <Switch
                checked={isOn}
                disabled={isTripped} // Cannot turn on if tripped (requires reset)
                onCheckedChange={() => toggleRelay(outlet.id, outlet.status)}
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
          </div>
          <div>
            <h3 className="font-bold text-lg truncate">{outlet.name}</h3>
            <p className="text-xs text-gray-500">Outlet #{outlet.id}</p>
            {(isOn || isTripped) && (
              <div className="mt-4 pt-4 border-t border-dashed space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Active Power</span>
                  <span className="font-bold text-blue-600">
                    {outlet.power} W
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                  <span>{outlet.voltage}V</span>
                  <span>{outlet.current}A</span>
                </div>
              </div>
            )}
          </div>
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
  );
}
