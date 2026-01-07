"use client";

import useSWR, { mutate } from "swr";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import DeviceManagement from "../layout/settings/device-management";
import GlobalConfiguration from "../layout/settings/globalConfiguration";
import ModeSelection from "../layout/settings/mode-selection";
import Loading from "../layout/general/Loading";
import { fetcher, Outlet, SystemConfig } from "@/lib/utils";

export default function Settings() {
  const { user } = useAuth();

  // 1. Fetch Config
  const { data: config, isLoading: loadingConfig } = useSWR<SystemConfig>(
    user ? `/api/admin/config?uid=${user.uid}` : null,
    fetcher
  );

  // 2. Fetch Outlets
  const { data: outlets, isLoading: loadingOutlets } = useSWR<Outlet[]>(
    user ? `/api/admin/outlets?uid=${user.uid}` : null,
    fetcher
  );

  // --- API HANDLERS ---

  const updateConfig = async (updates: Partial<SystemConfig>) => {
    if (!user) return;

    // Optimistic UI Update
    mutate(
      `/api/admin/config?uid=${user.uid}`,
      { ...config, ...updates },
      false
    );

    try {
      await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, ...updates }),
      });
      toast.success("Settings saved");
      mutate(`/api/admin/config?uid=${user.uid}`);
    } catch (e) {
      toast.error("Failed to save settings");
    }
  };

  if (loadingConfig || loadingOutlets) {
    return <Loading />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6 pb-20">
      {/* 1. MODE SELECTION */}
      <ModeSelection config={config} updateConfig={updateConfig} />
      {/* 2. GLOBAL CONFIGURATION */}
      <GlobalConfiguration updateConfig={updateConfig} config={config} />
      {/* 3. DEVICE MANAGEMENT */}
      <DeviceManagement outlets={outlets} config={config} user={user} />
    </div>
  );
}
