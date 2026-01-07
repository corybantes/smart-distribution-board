"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "../../ui/sidebar";
import { NotificationSheet } from "../../notifications/NotificationSheet";
import { Separator } from "../../ui/separator";

export default function Header() {
  const pathname = usePathname();
  const path = pathname.split("/").pop();
  const uuidRegex = /^[0-9a-zA-Z]{28}$/;
  const isUUID = uuidRegex.test(path ?? "");
  const items = [
    { title: "Dashboard", path: "dashboard" },
    { title: "Consumption Analytics", path: "consumption" },
    { title: "Billing", path: "billing" },
    { title: "System Operation", path: "settings" },
  ];
  const displayMessage = isUUID ? "dashboard" : path;
  return (
    <div className="w-full pl-6 px-5 py-2 md:px-6 md:py-4 flex justify-between items-center z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-gray-200 dark:border-white/10 sticky top-0">
      <div className="flex items-center gap-2 font-semibold text-[18px] md:text-xl">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="md:mx-2 data-[orientation=vertical]:h-4"
        />
        {items.map((item) => (
          <div key={item.title} className="">
            {displayMessage === item.path && <span>{item.title}</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <ModeToggle />
        <NotificationSheet />
      </div>
    </div>
  );
}
