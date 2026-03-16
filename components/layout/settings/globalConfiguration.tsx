"use client";

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
import { Skeleton } from "../../ui/skeleton"; // <-- Added Skeleton import

export default function GlobalConfiguration({
  config,
  updateConfig,
  isLoading = false, // <-- Added loading prop
}: {
  config: SystemConfig | undefined;
  updateConfig: any;
  isLoading?: boolean;
}) {
  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <section>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buzzer Skeleton */}
            <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>

            <Separator />

            {/* Price Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 mb-2" />
              <div className="flex gap-2 items-center">
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-4 w-1/2 ml-4" />
              </div>
            </div>

            <Separator />

            {/* Billing Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // --- ACTUAL DATA STATE ---
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
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                Alarm Buzzer
              </Label>
              <p className="text-xs text-muted-foreground">
                {config?.buzzerEnabled
                  ? "Alarm is currently sounding. Toggle off to silence."
                  : "Alarm is silent. It can only be triggered by the hardware."}
              </p>
            </div>
            <Switch
              checked={config?.buzzerEnabled || false}
              // FIX: Disable the switch if it's already off.
              // The user can only interact with it when it's ON.
              disabled={!config?.buzzerEnabled}
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
                  // onBlur is perfect here so it only updates Firebase when the user clicks away
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
              checked={config?.globalBillingEnabled || false}
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
