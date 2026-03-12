import { Save, Volume2, VolumeX } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Separator } from "../../ui/separator";
import { Switch } from "../../ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { SystemConfig } from "@/lib/utils";

export default function GlobalConfiguration({
  config,
  updateConfig,
}: {
  config: SystemConfig | undefined;
  updateConfig: any;
}) {
  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>
            Manage system-wide alerts and pricing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buzzer Toggle */}
          <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                {config?.buzzerEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                Alarm Buzzer
              </Label>
              <p className="text-xs text-muted-foreground">
                Sound the hardware alarm on critical events or low balance.
              </p>
            </div>
            <Switch
              checked={config?.buzzerEnabled}
              onCheckedChange={(checked) =>
                updateConfig({ buzzerEnabled: checked })
              }
            />
          </div>

          <Separator />

          {/* Price Configuration */}
          <div className="space-y-2">
            <Label>Electricity Rate (Currency / kWh)</Label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1.5 text-gray-500 font-bold">
                  ₦
                </span>
                <Input
                  type="number"
                  className="pl-8"
                  defaultValue={config?.pricePerKwh || 206.8}
                  onBlur={(e) =>
                    updateConfig({ pricePerKwh: Number(e.target.value) })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground w-1/2 ml-4">
                Used to calculate bill projections and deduct wallet balances.
              </p>
            </div>
          </div>

          <Separator />

          {/* Billing Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">System Billing</Label>
              <p className="text-xs text-muted-foreground">
                {config?.mode === "multi"
                  ? "Required for Multi-User Mode."
                  : "Enable cost tracking."}
              </p>
            </div>
            <Switch
              checked={config?.globalBillingEnabled}
              disabled={config?.mode === "multi"}
              onCheckedChange={(checked) =>
                updateConfig({ globalBillingEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
