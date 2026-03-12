import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2 } from "lucide-react";

export default function HardwareTenantWidget({ outlet, isLoading }: any) {
  if (!outlet) return null;
  const isOn = outlet.status === 1;

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
          <Badge
            variant="outline"
            className={`px-3 py-1 font-bold text-[10px] ${isOn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
          >
            {isOn ? "Active Online" : "Power Offline"}
          </Badge>
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
