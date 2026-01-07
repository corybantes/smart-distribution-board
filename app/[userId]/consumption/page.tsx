import Consumption from "@/components/page/consumption";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consumption",
  description: "Consumption page",
};

export default function Page() {
  return <Consumption />;
}
