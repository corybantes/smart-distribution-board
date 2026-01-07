import Billing from "@/components/page/billing";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing",
  description: "Billing page",
};

export default function Page() {
  return <Billing />;
}
