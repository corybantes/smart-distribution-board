"use client";

import { Loader2, Plus, User, Zap, Hash, Server } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { toast } from "sonner";
import { mutate } from "swr";
import { useState } from "react";
import { Outlet, SystemConfig } from "@/lib/utils";
import { Skeleton } from "../../ui/skeleton"; // <-- Imported Skeleton

export default function DeviceManagement({
  outlets,
  config,
  user,
  isLoading = false, // <-- Added loading prop
}: {
  outlets: Outlet[] | undefined;
  config: SystemConfig | undefined;
  user: any;
  isLoading?: boolean;
}) {
  // Form State for Adding Outlet
  const [newDevice, setNewDevice] = useState({ mac: "", name: "", email: "" });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddOutlet = async () => {
    if (!newDevice.mac || !newDevice.name)
      return toast.error("Hardware ID and Name are required");
    setIsAdding(true);

    try {
      await fetch("/api/admin/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newDevice.mac,
          name: newDevice.name,
          assignedEmail: newDevice.email,
          priority: (outlets?.length || 0) + 1,
          adminId: user?.uid,
        }),
      });
      setNewDevice({ mac: "", name: "", email: "" });
      mutate(`/api/admin/outlets?uid=${user?.uid}`);
      toast.success("Device provisioned successfully");
    } catch (e) {
      toast.error("Failed to provision device");
    } finally {
      setIsAdding(false);
    }
  };

  const updateOutlet = async (id: string, updates: Partial<Outlet>) => {
    const updatedList = outlets?.map((o) =>
      o.id === id ? { ...o, ...updates } : o,
    );
    mutate(`/api/admin/outlets?uid=${user?.uid}`, updatedList, false);

    try {
      await fetch("/api/admin/outlets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (e) {
      toast.error("Failed to update configuration");
    }
  };

  // Safely clone the array using [...array] before sorting to prevent read-only crashes
  const isSingleMode = config?.mode === "single";
  const sortedOutlets = [...(outlets || [])].sort((a, b) => {
    if (isSingleMode) {
      return (a.priority || 0) - (b.priority || 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Hardware Provisioning
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register new smart endpoints and manage tenant assignments.
          </p>
        </div>
        {isSingleMode && (
          <Badge
            variant="outline"
            className="w-fit bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 px-3 py-1"
          >
            <Server className="w-3 h-3 mr-1.5" />
            Priority Queuing Active
          </Badge>
        )}
      </div>

      {/* 1. ADD DEVICE FORM */}
      <Card className="bg-muted/30 border-dashed border-2 shadow-none">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="space-y-2 md:col-span-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Hardware MAC / ID
              </Label>
              <Input
                placeholder="e.g. ESP_A1B2"
                value={newDevice.mac}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, mac: e.target.value })
                }
                className="bg-background"
                disabled={isLoading || isAdding}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Display Name
              </Label>
              <Input
                placeholder="e.g. Apt 4B"
                value={newDevice.name}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, name: e.target.value })
                }
                className="bg-background"
                disabled={isLoading || isAdding}
              />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assign Tenant (Email)
              </Label>
              <Input
                type="email"
                placeholder="tenant@example.com"
                value={newDevice.email}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, email: e.target.value })
                }
                className="bg-background"
                disabled={isLoading || isAdding}
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handleAddOutlet}
                disabled={isLoading || isAdding} // <-- Disable while page is initially loading
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Provision
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. DEVICE MASTER LIST */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <CardTitle className="text-lg font-bold">Active Endpoints</CardTitle>
          <CardDescription>
            Manage the physical hardware connected to your distribution board.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            // --- SKELETON LOADING STATE ---
            <div className="divide-y divide-border">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={`skeleton-device-${i}`}
                    className="p-4 md:px-6 flex flex-col md:flex-row md:items-center gap-6"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="space-y-2 min-w-0">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-8 justify-between md:justify-end">
                      {isSingleMode && (
                        <div className="flex flex-col items-start md:items-center space-y-2">
                          <Skeleton className="h-2 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      )}
                      <div className="flex flex-col items-start md:items-end space-y-2">
                        <Skeleton className="h-2 w-10" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <div className="flex flex-col items-end min-w-20">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : sortedOutlets.length > 0 ? (
            // --- ACTUAL DATA ---
            <div className="divide-y divide-border">
              {sortedOutlets.map((outlet, index) => {
                const status = outlet.status || "active";
                const currentUsage = outlet.currentUsage || 0;
                const priority = outlet.priority || 0;

                // Determine row styling for Single Mode priority (highlight the top priority)
                const isTopPriority = isSingleMode && index === 0;

                return (
                  <div
                    key={outlet.id}
                    className={`p-4 md:px-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-muted/30 transition-colors ${isTopPriority ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                  >
                    {/* Column 1: Identity & Tenant */}
                    <div className="flex flex-1 items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isTopPriority ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}
                      >
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm md:text-base leading-none mb-1.5 flex items-center gap-2">
                          {outlet.name}
                          <span className="text-[10px] font-mono font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            ID: {outlet.id}
                          </span>
                        </h4>
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5 truncate">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {outlet.assignedEmail || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Controls & Telemetry */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-8 justify-between md:justify-end">
                      {/* Priority Input (Only visible in Single Mode) */}
                      {isSingleMode && (
                        <div className="flex flex-col items-start md:items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Priority Level
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            className={`w-16 h-8 text-center font-bold font-mono ${isTopPriority ? "border-blue-400 ring-1 ring-blue-400" : ""}`}
                            value={priority}
                            onChange={(e) =>
                              updateOutlet(outlet.id, {
                                priority: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}

                      {/* Live Usage */}
                      <div className="flex flex-col items-start md:items-end">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Load
                        </Label>
                        <div className="font-mono font-bold text-base leading-none">
                          {currentUsage}{" "}
                          <span className="text-[10px] text-muted-foreground font-sans uppercase">
                            kWh
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex flex-col items-end min-w-20">
                        <Badge
                          variant="outline"
                          className={`uppercase text-[10px] font-bold tracking-wider px-2.5 py-0.5 ${
                            status === "active"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // --- EMPTY STATE ---
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Server className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold">No Devices Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                You haven't provisioned any hardware endpoints yet. Add your
                first device using the form above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
