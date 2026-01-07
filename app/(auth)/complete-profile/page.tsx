import CompleteProfilePage from "@/components/auth/complete-profile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Profile",
  description: "Complete profile page",
};
export default function Page() {
  return <CompleteProfilePage />;
}
