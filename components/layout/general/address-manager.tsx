"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Search, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AddressManagerProps {
  currentAddress: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  onSave: (data: any) => Promise<void>;
}

export function AddressManager({
  currentAddress,
  onSave,
}: AddressManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Local form state
  const [formData, setFormData] = useState(currentAddress);

  // 1. Search Logic (OpenStreetMap Nominatim - Free, No Key)
  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=5`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      toast.error("Could not fetch address suggestions");
    } finally {
      setLoading(false);
    }
  };

  // 2. Auto-fill fields from selection
  const selectSuggestion = (item: any) => {
    const addr = item.address;
    setFormData({
      address:
        `${addr.house_number || ""} ${addr.road || ""}`.trim() ||
        item.display_name.split(",")[0],
      city: addr.city || addr.town || addr.village || addr.county || "",
      state: addr.state || addr.region || "",
      country: addr.country || "",
    });
    setSuggestions([]); // Clear suggestions
    toast.success("Address verified & filled!");
  };

  // 3. Save Handler
  const handleSave = async () => {
    // Basic Validation
    if (!formData.country || !formData.state) {
      toast.error("State and Country are required");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData); // Sends all 4 fields at once
      setIsOpen(false);
      toast.success("Location updated successfully");
    } catch (error) {
      toast.error("Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* TRIGGER: The Read-Only View */}
      <div className="space-y-4">
        <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/50 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Current Location
              </span>
            </div>
            <p className="font-semibold text-lg">
              {currentAddress.address || "No Street Set"}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentAddress.city}, {currentAddress.state},{" "}
              {currentAddress.country}
            </p>
          </div>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData(currentAddress)}
            >
              Update
            </Button>
          </DialogTrigger>
        </div>
      </div>

      {/* MODAL CONTENT */}
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Update Location</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* SEARCH BAR */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-blue-600 uppercase">
              Step 1: Search Address
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 123 Main St, Lagos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button size="icon" onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto bg-white dark:bg-slate-950">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 truncate"
                    onClick={() => selectSuggestion(s)}
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-xs font-bold text-gray-500 uppercase">
              Step 2: Confirm Details
            </Label>

            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Verify & Save Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
