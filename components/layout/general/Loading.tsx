import React from "react";
import { Skeleton } from "../../ui/skeleton";
import { Loader2 } from "lucide-react";

function Loading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default Loading;

export function SidebarLoading() {
  return Array(4)
    .fill(0)
    .map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />);
}

export function AvatarLoading() {
  <div className="h-full w-full flex items-center justify-center bg-muted">
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  </div>;
}

export function CardLoadingSkeleton({ isDark = false }: { isDark?: boolean }) {
  const baseBg = isDark ? "bg-white/20" : "bg-muted";
  return (
    <div className="animate-pulse">
      <div className={`h-10 w-32 rounded ${baseBg} mt-1`} />
      <div className={`h-4 w-20 rounded ${baseBg} mt-2 opacity-70`} />
    </div>
  );
}
