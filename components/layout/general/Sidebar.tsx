"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Zap,
  FileText,
  Settings,
  LogOut,
  Loader2,
  User2,
  Bell,
  LogOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../../ui/sidebar";
import { UserAvatar } from "./user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useAuth } from "@/context/AuthContext";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SidebarComponent() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { userData } = useAuth();

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. Fetch User Profile (To get Role)
  const { data: profile, isLoading: loadingProfile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher
  );

  // 3. Fetch Config (To check System Mode)
  // Only fetch config if we have a user.
  // Note: For tenants, this might need adjustment depending on your backend logic,
  // but for now we'll fetch based on the logged-in user or their linked admin.
  // Assuming the API handles permission checks.
  const { data: config } = useSWR(
    user && profile?.role === "admin"
      ? `/api/admin/config?uid=${user.uid}`
      : null,
    fetcher
  );

  // --- MENU LOGIC ---
  const systemMode = config?.mode || "multi"; // Default to multi if unknown

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: `/${userId}` },
    { icon: Zap, label: "Consumption", href: `/${userId}/consumption` },
  ];

  // Logic: Show Billing if Admin OR if System is in Multi-User mode
  // Tenants usually need to see billing in Multi-User mode.
  const showBilling =
    profile?.role === "admin" ||
    systemMode === "multi" ||
    profile?.role === "tenant";

  if (showBilling) {
    menuItems.push({
      icon: FileText,
      label: "Billing",
      href: `/${userId}/billing`,
    });
  }

  // Settings is usually Admin only, or limited for Tenants
  if (profile?.role === "admin") {
    menuItems.push({
      icon: Settings,
      label: "Settings",
      href: `/${userId}/settings`,
    });
  }

  // --- ACTIONS ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  return (
    <div>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <a href="#">
                  <Zap className="size-5!" />
                  <span className="text-base font-semibold">Smart DB</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        pathname === item.href && "font-semibold shadow-sm"
                      )}
                    >
                      <a href={item.href}>
                        <item.icon
                          className={cn(
                            pathname !== item.href && "text-muted-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      {
                        <>
                          <AvatarImage
                            src={userData?.photoURL}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {userData?.firstName
                              ? userData.firstName.substring(0, 2).toUpperCase()
                              : "US"}
                          </AvatarFallback>
                        </>
                      }
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {userData?.firstName}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {userData?.email}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={userData?.photoURL}
                          alt={userData?.firstName}
                        />
                        <AvatarFallback className="rounded-lg">
                          {userData?.firstName
                            ? userData.firstName.substring(0, 2).toUpperCase()
                            : "US"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {userData?.firstName}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {userData?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href={`/${userId}/profile`}>
                        <User2 />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
