"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Zap,
  FileText,
  Settings,
  User2,
  Bell,
  LogOutIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../../ui/sidebar";
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

  // 2. Fetch User Profile
  const { data: profile } = useSWR(
    user ? `/api/user?uid=${user.uid}` : null,
    fetcher,
  );

  // 3. Fetch Config
  const { data: config } = useSWR(
    user && profile?.role === "admin"
      ? `/api/admin/config?uid=${user.uid}`
      : null,
    fetcher,
  );

  // --- MENU LOGIC WITH GROUPING ---
  const systemMode = config?.mode || "multi";
  const showBilling =
    profile?.role === "admin" ||
    systemMode === "multi" ||
    profile?.role === "tenant";

  // Group 1: Core Dashboard Features
  const mainItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: `/${userId}` },
    { icon: Zap, label: "Consumption", href: `/${userId}/consumption` },
  ];

  if (showBilling) {
    mainItems.push({
      icon: FileText,
      label: "Billing",
      href: `/${userId}/billing`,
    });
  }

  // Group 2: System & Settings
  const systemItems = [];
  if (profile?.role === "admin") {
    systemItems.push({
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
      <Sidebar collapsible="icon" className="border-r shadow-xs">
        {/* HEADER: Upgraded Logo Lockup */}
        <SidebarHeader className="pt-4 pb-2 px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href={`/${userId}`}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                    <Zap className="size-5" fill="currentColor" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-base tracking-tight">
                      SmartDB
                    </span>
                    <span className="truncate text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                      EnerGenius
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-0 space-y-4 mt-2">
          {/* GROUP 1: OVERVIEW */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Overview
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-1">
              <SidebarMenu className="space-y-1">
                {mainItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.label}>
                      {/* Added tooltip for flawless collapsed behavior */}
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className={cn(
                          "transition-all duration-200 h-10 px-3",
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon
                            className={cn(
                              "size-5",
                              isActive ? "text-primary-foreground" : "",
                            )}
                          />
                          <span className="ml-2 group-data-[collapsible=icon]:hidden">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* GROUP 2: SYSTEM (Only shows if there are items) */}
          {systemItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu className="space-y-1">
                  {systemItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.label}
                          className={cn(
                            "transition-all duration-200 h-10 px-3",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                          )}
                        >
                          <Link href={item.href}>
                            <item.icon
                              className={cn(
                                "size-5",
                                isActive ? "text-primary-foreground" : "",
                              )}
                            />
                            <span className="ml-2 group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="py-4 border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg shadow-sm">
                      <AvatarImage
                        src={userData?.photoURL}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-lg">
                        {userData?.firstName
                          ? userData.firstName.substring(0, 2).toUpperCase()
                          : "US"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {userData?.firstName || "User"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
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
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                          {userData?.firstName
                            ? userData.firstName.substring(0, 2).toUpperCase()
                            : "US"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {userData?.firstName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {userData?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/${userId}/profile`}>
                        <User2 className="mr-2 size-4" />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell className="mr-2 size-4" />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  >
                    <LogOutIcon className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* LOGOUT DIALOG */}
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
