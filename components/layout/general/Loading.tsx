import React from "react";
import { Skeleton } from "../../ui/skeleton";
import { Loader2 } from "lucide-react";
import { TableRow, TableCell } from "../../ui/table"; // <-- Add this import

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
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
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

// --- NEW REUSABLE TABLE SKELETON ---
export function TableLoadingSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array(rows)
        .fill(0)
        .map((_, rowIndex) => (
          <TableRow key={`skeleton-row-${rowIndex}`}>
            {Array(columns)
              .fill(0)
              .map((_, colIndex) => (
                <TableCell key={`skeleton-col-${colIndex}`}>
                  <Skeleton
                    className={`h-4 rounded-md ${
                      colIndex === 0
                        ? "w-24" // Shorter first column (e.g., ID or Date)
                        : colIndex === columns - 1
                          ? "w-16 ml-auto" // Right-aligned last column (e.g., Amount or Actions)
                          : "w-full max-w-45" // Standard middle columns
                    }`}
                  />
                </TableCell>
              ))}
          </TableRow>
        ))}
    </>
  );
}
