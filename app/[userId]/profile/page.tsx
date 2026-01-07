import ProfilePage from "@/components/page/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Profile page",
};

export default function Page() {
  return <ProfilePage />;
}
