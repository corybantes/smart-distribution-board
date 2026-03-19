"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { fetcher } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Home, Users } from "lucide-react";
import { toast } from "sonner";

export default function SystemConfiguration() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState<"single" | "multi">("single");
  const [outlets, setOutlets] = useState([
    { id: 1, email: "", label: "Room 1" },
    { id: 2, email: "", label: "Room 2" },
    { id: 3, email: "", label: "Room 3" },
    { id: 4, email: "", label: "Room 4" },
  ]);

  // 1. Securely fetch the admin data using our API
  const { data: adminData, isLoading } = useSWR(
    auth.currentUser ? `/api/user` : null,
    fetcher,
  );

  // Sync state when data loads
  useEffect(() => {
    if (adminData) {
      if (adminData.systemMode) setMode(adminData.systemMode);
      if (adminData.outletsConfig) {
        // Map backend schema back to this component's local state schema
        setOutlets(
          adminData.outletsConfig.map((o: any) => ({
            id: o.id,
            email: o.assignedEmail || o.email || "",
            label: o.name || o.label || `Room ${o.id}`,
          })),
        );
      }
    }
  }, [adminData]);

  const handleOutletChange = (id: number, field: string, value: string) => {
    setOutlets((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );
  };

  const handleSaveConfiguration = async () => {
    if (!auth.currentUser || !adminData) return;
    setIsSaving(true);

    try {
      const token = await auth.currentUser.getIdToken();

      // FIX: Format the array to match the strict schema used in DeviceManagement
      // This injects the proper default 'inactive' status for tenants!
      const formattedOutlets = outlets.map((o, index) => ({
        id: o.id.toString(),
        name: o.label, // Maps to DeviceManagement schema
        label: o.label, // Kept for backward compatibility with backend
        assignedEmail: o.email, // Maps to DeviceManagement schema
        email: o.email, // Kept for backward compatibility with backend
        priority: index + 1,
        status: mode === "single" ? "active" : "inactive", // Security Lock Default!
      }));

      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          outlets: mode === "multi" ? formattedOutlets : [],
          smartDbId: adminData.smartDbId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Configuration failed to save");
      }

      toast.success("Configuration saved successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Choose how your Smart Distribution Board will operate. You can
            change this later in settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-4">
            <Label className="text-base">Operating Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(val) => setMode(val as "single" | "multi")}
              className="grid grid-cols-2 gap-4"
            >
              {/* Single User Option */}
              <div>
                <RadioGroupItem
                  value="single"
                  id="single"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="single"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Home className="mb-3 h-6 w-6" />
                  Single-Family Home
                  <span className="text-xs font-normal text-muted-foreground mt-2 text-center">
                    I am tracking my own home. Combine all outlets into one
                    total bill.
                  </span>
                </Label>
              </div>

              {/* Multi User Option */}
              <div>
                <RadioGroupItem
                  value="multi"
                  id="multi"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="multi"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Users className="mb-3 h-6 w-6" />
                  Co-Rental Apartments
                  <span className="text-xs font-normal text-muted-foreground mt-2 text-center">
                    I am a landlord. Assign specific outlets to specific tenants
                    for separate billing.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dynamic Tenant Assignment (Only shows if Multi-User) */}
          {mode === "multi" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-1">
                  Assign Outlets to Tenants
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Enter the email address of the tenant staying in each room.
                  When they create an account, they will automatically be linked
                  to their assigned outlet.
                </p>

                <div className="space-y-4">
                  {outlets.map((outlet) => (
                    <div
                      key={outlet.id}
                      className="flex gap-4 items-center bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border"
                    >
                      <div className="w-12 text-center font-bold text-gray-500">
                        O{outlet.id}
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Room Label</Label>
                        <Input
                          placeholder="e.g. Room A"
                          value={outlet.label}
                          onChange={(e) =>
                            handleOutletChange(
                              outlet.id,
                              "label",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Tenant Email</Label>
                        <Input
                          type="email"
                          placeholder="tenant@example.com"
                          value={outlet.email}
                          onChange={(e) =>
                            handleOutletChange(
                              outlet.id,
                              "email",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveConfiguration}
            disabled={isSaving || !adminData}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & Apply Configuration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
