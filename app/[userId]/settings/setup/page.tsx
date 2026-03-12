import SystemConfiguration from "@/components/layout/settings/setup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup",
  description: "Setup page",
};

export default function Page() {
  return (
    <div className="w-full">
      <SystemConfiguration />
    </div>
  );
}
