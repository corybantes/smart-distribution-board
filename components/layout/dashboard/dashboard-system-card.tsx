import { Volume2, Zap } from "lucide-react";
import { Card } from "../../ui/card";
import { EnergyApiResponse } from "@/lib/utils";

export default function DashboardSystemCard({
  energyData,
}: {
  energyData: EnergyApiResponse;
}) {
  return (
    <Card className="@container/card col-span-1 md:col-span-2 xl:col-span-4 bg-slate-900 text-white border-none p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="text-orange-400" />
        <h3 className="font-bold">System Status</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Board Temp</span>
          <span className="font-mono text-emerald-400">
            {energyData.temperature || 0}°C
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Alarm Buzzer</span>
          <div className="flex items-center gap-2">
            <Volume2
              size={16}
              className={energyData.buzzer ? "text-red-500" : "text-gray-600"}
            />
            <span
              className={`text-xs font-bold ${
                energyData.buzzer ? "text-red-500" : "text-gray-500"
              }`}
            >
              {energyData.buzzer ? "ACTIVE" : "SILENT"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Last Updated:{" "}
            {new Date(energyData.timestamp * 1000).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
