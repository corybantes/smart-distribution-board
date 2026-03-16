"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth"; // Assuming you use this, or standard onAuthStateChanged
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
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  const [mode, setMode] = useState<"single" | "multi">("single");
  const [outlets, setOutlets] = useState([
    { id: 1, email: "", label: "Room 1" },
    { id: 2, email: "", label: "Room 2" },
    { id: 3, email: "", label: "Room 3" },
    { id: 4, email: "", label: "Room 4" },
  ]);

  // Fetch existing config if they are editing from settings later
  useEffect(() => {
    if (user) {
      const fetchAdminData = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdminData(data);
          if (data.systemMode) setMode(data.systemMode);
          if (data.outletsConfig) setOutlets(data.outletsConfig);
        }
      };
      fetchAdminData();
    }
  }, [user]);

  const handleOutletChange = (id: number, field: string, value: string) => {
    setOutlets((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );
  };

  const handleSaveConfiguration = async () => {
    if (!user || !adminData) return;
    setIsSaving(true);

    try {
      // 1. Update the Admin's Document with the chosen mode and config
      const adminRef = doc(db, "users", user.uid);
      await updateDoc(adminRef, {
        systemMode: mode,
        outletsConfig: mode === "multi" ? outlets : [], // Only save emails if multi
        isConfigured: true,
      });

      // 2. If Multi-User, generate the Tenant Invites
      if (mode === "multi") {
        for (const outlet of outlets) {
          if (outlet.email.trim() !== "") {
            const inviteRef = doc(
              db,
              "users",
              outlet.email.trim().toLowerCase(),
            );
            // Create the temporary invite document we built the SignupPage for
            await setDoc(
              inviteRef,
              {
                adminId: user.uid,
                smartDbId: adminData.smartDbId, // Pass the board ID to the tenant
                outletId: outlet.id.toString(), // Assign them to O1, O2, etc.
                assignedLabel: outlet.label, // e.g., "Room 1"
                role: "tenant",
                inviteStatus: "pending",
              },
              { merge: true },
            ); // Merge ensures we don't overwrite an existing active tenant by mistake
          }
        }
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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
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
              defaultValue={mode}
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
                      className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border"
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
                      <div className="flex-2 space-y-1">
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
