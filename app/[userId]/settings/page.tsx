import Settings from "@/components/page/settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Settings page",
};

export default function Page() {
  return (
    <div className="w-full">
      <Settings />
    </div>
  );
}
