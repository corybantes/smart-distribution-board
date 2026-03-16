"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/login", "/signup", "/", "/forgot-password", "/about"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Do nothing while loading

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // 1. If user is NOT logged in AND tries to access a protected page
    if (!user && !isPublicPath) {
      router.replace("/login"); // Use replace instead of push to avoid broken "Back" button history
    }

    // 2. If user IS logged in AND tries to access login/signup/home
    if (user && isPublicPath) {
      // Redirect to their unique dashboard
      router.replace(`/${user.uid}`);
    }
  }, [user, loading, pathname, router]);

  // Show a full-screen loader while checking auth status
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-500 text-sm animate-pulse">
            Verifying Access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
