import About from "@/components/page/about";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn More",
  description: "About page",
};

export default function Page() {
  return <About />;
}
