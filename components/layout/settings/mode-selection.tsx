"use client";

import { Layers, Users, Zap } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { SystemConfig } from "@/lib/utils";
import { Skeleton } from "../../ui/skeleton"; // <-- Added Skeleton import

export default function ModeSelection({
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Render 2 identical skeleton cards */}
          {[1, 2].map((i) => (
            <Card
              key={`mode-skeleton-${i}`}
              className="shadow-sm border-border"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-4">
                  {/* Icon Skeleton */}
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                {/* Title Skeleton */}
                <Skeleton className="h-6 w-40 mb-1 mt-4" />
                {/* Description Skeletons */}
                <div className="space-y-2 mt-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // --- ACTUAL DATA STATE ---
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Multi User Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-blue-300 ${
            config?.mode === "multi" ? "border-blue-500 bg-blue-50/50" : ""
          }`}
          onClick={() =>
            updateConfig({ mode: "multi", globalBillingEnabled: true })
          }
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users
                className={`h-8 w-8 ${
                  config?.mode === "multi" ? "text-blue-600" : "text-gray-400"
                }`}
              />
              {config?.mode === "multi" && (
                <Zap className="h-5 w-5 text-blue-500" fill="currentColor" />
              )}
            </div>
            <CardTitle className="mt-4">Multi-User Mode</CardTitle>
            <CardDescription>
              Each outlet acts as an independent apartment. Billing is enforced
              per outlet.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Single User Card */}
        <Card
          className={`cursor-pointer transition-all hover:border-purple-300 ${
            config?.mode === "single" ? "border-purple-500 bg-purple-50/50" : ""
          }`}
          onClick={() => updateConfig({ mode: "single" })}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Layers
                className={`h-8 w-8 ${
                  config?.mode === "single"
                    ? "text-purple-600"
                    : "text-gray-400"
                }`}
              />
              {config?.mode === "single" && (
                <Zap className="h-5 w-5 text-purple-500" fill="currentColor" />
              )}
            </div>
            <CardTitle className="mt-4">Single-User Mode</CardTitle>
            <CardDescription>
              One main bill. Load shedding activates based on Priority List to
              prevent overload.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
