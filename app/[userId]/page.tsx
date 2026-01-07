import Dashboard from "@/components/page/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard page",
};

export default function Page() {
  return <Dashboard />;
}
