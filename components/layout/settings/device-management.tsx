import { Loader2, Plus, User, Zap } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { toast } from "sonner";
import { mutate } from "swr";
import { useState } from "react";
import { Outlet, SystemConfig } from "@/lib/utils";

export default function DeviceManagement({
  outlets,
  config,
  user,
}: {
  outlets: Outlet[] | undefined;
  config: SystemConfig | undefined;
  user: any;
}) {
  // Form State for Adding Outlet
  const [newDevice, setNewDevice] = useState({ mac: "", name: "", email: "" });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddOutlet = async () => {
    if (!newDevice.mac || !newDevice.name)
      return toast.error("Details required");
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
      toast.success("Device added successfully");
    } catch (e) {
      toast.error("Failed to add device");
    } finally {
      setIsAdding(false);
    }
  };

  const updateOutlet = async (id: string, updates: Partial<Outlet>) => {
    // Optimistic Update
    const updatedList = outlets?.map((o) =>
      o.id === id ? { ...o, ...updates } : o
    );
    mutate(`/api/admin/outlets?uid=${user?.uid}`, updatedList, false);

    try {
      await fetch("/api/admin/outlets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (e) {
      toast.error("Update failed");
    }
  };
  // Sort Outlets based on mode
  const sortedOutlets =
    config?.mode === "single"
      ? outlets?.sort((a, b) => a.priority - b.priority)
      : outlets?.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Devices</h2>
        {config?.mode === "single" && (
          <Badge variant="secondary">Priority Order Active</Badge>
        )}
      </div>
      {/* Add Device Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Apartment ID</Label>
              <Input
                placeholder="XYZ_123"
                value={newDevice.mac}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, mac: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Living Room"
                value={newDevice.name}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Assign User (Email)</Label>
              <Input
                placeholder="user@example.com"
                value={newDevice.email}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, email: e.target.value })
                }
              />
            </div>
            <Button onClick={handleAddOutlet} disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Device
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Device List */}
      <div className="grid gap-4">
        {sortedOutlets?.map((outlet, index) => (
          <Card
            key={outlet.id}
            className={
              config?.mode === "single" && index === 0
                ? "border-l-4 border-l-green-500"
                : ""
            }
          >
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
              {/* Priority Input (Single Mode) */}
              {config?.mode === "single" && (
                <div className="flex flex-col items-center pr-4 md:border-r">
                  <Label className="text-[10px] uppercase text-muted-foreground mb-1">
                    Priority
                  </Label>
                  <Input
                    type="number"
                    className="w-14 h-9 text-center font-bold"
                    value={outlet.priority}
                    onChange={(e) =>
                      updateOutlet(outlet.id, {
                        priority: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              {/* Icon & Details */}
              <div className="flex-1 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold">{outlet.name}</h4>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <User className="h-3 w-3" />
                    {outlet.assignedEmail || "Unassigned"}
                  </div>
                </div>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {config?.globalBillingEnabled && (
                  <div className="text-right">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Limit (kWh)
                    </Label>
                    <Input
                      type="number"
                      className="w-20 h-8 text-right"
                      defaultValue={outlet.unitLimit}
                      onBlur={(e) =>
                        updateOutlet(outlet.id, {
                          unitLimit: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                <div className="text-right">
                  <Label className="text-[10px] uppercase text-muted-foreground">
                    Usage
                  </Label>
                  <div className="font-mono font-bold">
                    {outlet.currentUsage}{" "}
                    <span className="text-xs text-muted-foreground font-sans">
                      kWh
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    outlet.status === "active" ? "default" : "destructive"
                  }
                >
                  {outlet.status.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
