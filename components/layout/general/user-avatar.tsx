"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Camera, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import useSWR, { mutate } from "swr";

// Shadcn Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar() {
  const { user } = useAuth(); // Only need the User object for ID
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch User Data via API (Ensures we get the latest DB photo)
  // We use SWR so the avatar auto-updates everywhere when the cache changes
  const { data: userData } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    (url) => fetch(url).then((res) => res.json())
  );

  const previewUrl = userData?.photoURL;

  // 2. Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Compress
      const base64String = await compressImage(file);

      // Send to API
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          photoURL: base64String,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      // Force refresh data
      mutate(`/api/user?uid=${user.uid}`);
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  // 3. Handle Removal
  const handleRemovePhoto = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, photoURL: "" }),
      });

      mutate(`/api/user?uid=${user.uid}`);
      toast.success("Photo removed");
    } catch (error) {
      toast.error("Could not remove photo");
    } finally {
      setUploading(false);
    }
  };

  //   if (!user) return null;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              {uploading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <AvatarImage src={previewUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {userData?.firstName
                      ? userData.firstName.substring(0, 2).toUpperCase()
                      : "US"}
                  </AvatarFallback>
                </>
              )}
            </Avatar>

            {/* Hover Overlay Icon */}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" /> Change Photo
          </DropdownMenuItem>

          {previewUrl && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={handleRemovePhoto}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove Photo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
