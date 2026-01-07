"use client";

import useSWR, { mutate } from "swr";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/layout/general/user-avatar";
import { EditableField } from "@/components/layout/general/editable-field";
import { AddressManager } from "@/components/layout/general/address-manager";

// Icons
import { Mail, User as UserIcon, ShieldCheck, MapPin } from "lucide-react";

// Shadcn Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const { user } = useAuth();
  const API_URL = user ? `/api/user?uid=${user.uid}` : null;

  const { data: profile, isLoading } = useSWR(API_URL, fetcher);

  // 1. Handle Single Field Updates (Personal Details)
  const handleFieldUpdate = async (key: string, newValue: string) => {
    if (!user) return;
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, [key]: newValue }),
    });
    if (!res.ok) throw new Error("Failed");
    mutate(API_URL);
  };

  // 2. Handle Bulk Address Update
  const handleAddressUpdate = async (addressData: any) => {
    if (!user) return;
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, ...addressData }),
    });
    if (!res.ok) throw new Error("Failed");
    mutate(API_URL);
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 md:px-6 space-y-8">
      {/* --- NEW CLEAN HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 border-b pb-8 px-2 md:px-0">
        {/* Avatar: Larger size, clean presentation */}
        <div className="relative">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full ring-4 ring-background bg-muted flex items-center justify-center overflow-hidden relative z-10">
            {/* We need to wrap UserAvatar to override its default size styling if necessary, 
                     or ensure UserAvatar fills this container. Assuming UserAvatar is flexible: */}
            <div className="scale-[2.5] md:scale-[3.5]">
              <UserAvatar />
            </div>
          </div>
        </div>

        {/* Text Info */}
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {profile?.firstName} {profile?.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{profile?.email}</span>
            </div>
            {profile?.city && profile?.country && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {profile.city}, {profile.country}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="pt-2">
            <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
              {profile?.role || "User"} Account
            </Badge>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID CONTENT --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT SIDEBAR (Read-Only / System Info) - Takes 4 columns */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                System Details
              </CardTitle>
              <CardDescription>Read-only system information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  SmartDB ID
                </label>
                <div className="font-mono border rounded p-2 mt-1 text-sm truncate">
                  {profile?.smartDbId || "Not Assigned"}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Role
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="capitalize font-medium">
                    {profile?.role}
                  </span>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                To change your email or account role, please contact system
                administration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT MAIN CONTENT (Editable Forms) - Takes 8 columns */}
        <div className="md:col-span-8 space-y-8 px-2 md:px-0">
          {/* Section 1: Personal Information */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Personal Information
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your basic personal details.
              </p>
            </div>
            <Card>
              <CardContent className="pt-0 divide-y">
                <EditableField
                  label="First Name"
                  value={profile?.firstName}
                  fieldKey="firstName"
                  onSave={handleFieldUpdate}
                />
                <EditableField
                  label="Last Name"
                  value={profile?.lastName}
                  fieldKey="lastName"
                  onSave={handleFieldUpdate}
                />
                <EditableField
                  label="Phone Number"
                  value={profile?.phone}
                  fieldKey="phone"
                  onSave={handleFieldUpdate}
                />
              </CardContent>
            </Card>
          </section>

          {/* Section 2: Address */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Address & Location
              </h2>
              <p className="text-sm text-muted-foreground">
                Your verified location helps with accurate services.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <AddressManager
                  currentAddress={{
                    address: profile?.address || "",
                    city: profile?.city || "",
                    state: profile?.state || "",
                    country: profile?.country || "",
                  }}
                  onSave={handleAddressUpdate}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

// Updated Skeleton to match the new layout
function ProfileSkeleton() {
  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 md:px-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-6 border-b pb-8">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="md:col-span-8 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
