"use client";

import {
  Loader2,
  Plus,
  User,
  Zap,
  Hash,
  Power,
  Clock,
  CheckCircle2,
} from "lucide-react";
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
import { Switch } from "../../ui/switch";
import { toast } from "sonner";
import { mutate } from "swr";
import { useState } from "react";
import { Outlet, SystemConfig } from "@/lib/utils";
import { Skeleton } from "../../ui/skeleton";
import { auth } from "@/lib/firebase";

export default function DeviceManagement({
  outlets,
  config,
  user,
  isLoading = false,
}: {
  outlets: Outlet[] | undefined;
  config: SystemConfig | undefined;
  user: any;
  isLoading?: boolean;
}) {
  const isSingleMode = config?.mode === "single";

  // Form State
  const [newOutlet, setNewOutlet] = useState({
    channel: "",
    name: "",
    email: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddOutlet = async () => {
    if (!newOutlet.channel || !newOutlet.name) {
      return toast.error("Channel Number and Name are required");
    }
    if (!isSingleMode && !newOutlet.email) {
      return toast.error("Tenant Email is required in Multi-User mode");
    }

    setIsAdding(true);

    try {
      const token = await auth.currentUser?.getIdToken();

      await fetch("/api/admin/outlets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: newOutlet.channel,
          name: newOutlet.name,
          assignedEmail: isSingleMode ? null : newOutlet.email,
          priority: (outlets?.length || 0) + 1,
          adminId: user?.uid,
          // FIX: Single users default to active, Tenants default to inactive (Suspended)
          status: isSingleMode ? "active" : "inactive",
        }),
      });

      setNewOutlet({ channel: "", name: "", email: "" });
      mutate(`/api/admin/outlets?uid=${user?.uid}`);
      toast.success("Outlet added successfully");
    } catch (e) {
      toast.error("Failed to add outlet");
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
      const token = await auth.currentUser?.getIdToken();

      await fetch("/api/admin/outlets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (e) {
      toast.error("Failed to update outlet");
      mutate(`/api/admin/outlets?uid=${user?.uid}`);
    }
  };

  const sortedOutlets = [...(outlets || [])].sort((a, b) => {
    if (isSingleMode) {
      return (a.priority || 0) - (b.priority || 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isSingleMode
              ? "Home Circuit Management"
              : "Tenant Room Management"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isSingleMode
              ? "Configure your home's circuits and set priority levels for load shedding."
              : "Assign physical board channels to specific tenants for separate billing."}
          </p>
        </div>
        {isSingleMode && (
          <Badge
            variant="outline"
            className="w-fit bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 px-3 py-1"
          >
            <Power className="w-3 h-3 mr-1.5" />
            Priority Queuing Active
          </Badge>
        )}
      </div>

      {/* 1. ADD OUTLET FORM */}
      <Card className="bg-muted/30 border-dashed border-2 shadow-none">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            <div className="space-y-2 lg:col-span-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Outlet Channel (1-4)
              </Label>
              <Input
                type="number"
                min="1"
                max="4"
                placeholder="e.g. 1"
                value={newOutlet.channel}
                onChange={(e) =>
                  setNewOutlet({ ...newOutlet, channel: e.target.value })
                }
                className="bg-background"
                disabled={isLoading || isAdding}
              />
            </div>

            <div className="space-y-2 lg:col-span-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isSingleMode ? "Circuit/Appliance Name" : "Room Name"}
              </Label>
              <Input
                placeholder={isSingleMode ? "e.g. Water Heater" : "e.g. Room A"}
                value={newOutlet.name}
                onChange={(e) =>
                  setNewOutlet({ ...newOutlet, name: e.target.value })
                }
                className="bg-background"
                disabled={isLoading || isAdding}
              />
            </div>

            {/* Conditionally Render Email Field */}
            {!isSingleMode && (
              <div className="space-y-2 lg:col-span-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assign Tenant (Email)
                </Label>
                <Input
                  type="email"
                  placeholder="tenant@example.com"
                  value={newOutlet.email}
                  onChange={(e) =>
                    setNewOutlet({ ...newOutlet, email: e.target.value })
                  }
                  className="bg-background"
                  disabled={isLoading || isAdding}
                />
              </div>
            )}

            <div
              className={`lg:col-span-${isSingleMode ? "6" : "2"} mt-2 sm:mt-0`}
            >
              <Button
                onClick={handleAddOutlet}
                disabled={isLoading || isAdding}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white lg:px-3"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Outlet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. OUTLET MASTER LIST */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <CardTitle className="text-lg font-bold">
            Configured Channels
          </CardTitle>
          <CardDescription>
            Control power access and priorities for your configured outlets.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="p-4 md:px-6 flex items-center gap-6"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
            </div>
          ) : sortedOutlets.length > 0 ? (
            <div className="divide-y divide-border">
              {sortedOutlets.map((outlet, index) => {
                const isServiceActive = outlet.status !== "inactive";
                const priority = outlet.priority || 0;
                const isTopPriority = isSingleMode && index === 0;

                // FIX: Safely check for valid tenant name string, rejecting JavaScript's "undefined undefined"
                const hasValidName =
                  outlet.tenantName &&
                  outlet.tenantName.trim() !== "" &&
                  !outlet.tenantName.includes("undefined");
                const isRegistered = !!hasValidName;

                return (
                  <div
                    key={outlet.id}
                    className={`p-4 md:px-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors ${
                      isTopPriority ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    {/* Identity Column */}
                    <div className="flex flex-1 items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          !isServiceActive
                            ? "bg-red-100 text-red-500 dark:bg-red-900/30"
                            : isTopPriority
                              ? "bg-blue-600 text-white"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm md:text-base leading-none mb-1.5 flex items-center gap-2">
                          {outlet.name}
                          <span className="text-[10px] font-mono font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            CH: {outlet.id}
                          </span>
                        </h4>
                        {!isSingleMode && outlet.assignedEmail && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center text-xs text-muted-foreground gap-2 truncate">
                              <span className="truncate">
                                {outlet.assignedEmail}
                              </span>
                              {isRegistered ? (
                                <span className="flex items-center text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded font-medium">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {outlet.tenantName}{" "}
                                  {/* Shows their actual name! */}
                                </span>
                              ) : (
                                <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-medium">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending Invite
                                </span>
                              )}
                            </div>
                            {/* Bonus: Show their current wallet balance if registered */}
                            {isRegistered && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                Wallet: ₦
                                {(
                                  outlet as any
                                ).tenantBalance?.toLocaleString() || 0}
                              </div>
                            )}
                          </div>
                        )}
                        {!isSingleMode && !outlet.assignedEmail && (
                          <div className="flex items-center text-xs text-muted-foreground gap-1.5 truncate">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">Unassigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controls Column */}
                    <div className="flex flex-row items-center gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                      {isSingleMode && (
                        <div className="flex flex-col items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Priority
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            className={`w-16 h-8 text-center font-bold font-mono ${
                              isTopPriority
                                ? "border-blue-400 ring-1 ring-blue-400"
                                : ""
                            }`}
                            value={priority}
                            onChange={(e) =>
                              updateOutlet(outlet.id, {
                                priority: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}

                      {/* Admin Master Lock Toggle */}
                      <div className="flex flex-col items-center sm:items-end">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {isServiceActive
                            ? "Service Active"
                            : "Service Suspended"}
                        </Label>
                        <Switch
                          checked={isServiceActive}
                          onCheckedChange={(checked) =>
                            updateOutlet(outlet.id, {
                              status: checked ? "active" : "inactive",
                            })
                          }
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Power className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold">No Channels Configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                You haven't assigned any physical channels yet. Use the form
                above to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
