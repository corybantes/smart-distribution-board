import SignupPage from "@/components/auth/signup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signup",
  description: "Signup page",
};

export default function Page() {
  return <SignupPage />;
}
