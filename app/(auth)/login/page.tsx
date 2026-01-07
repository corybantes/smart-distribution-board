import LoginPage from "@/components/auth/login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login page",
};

export default function Page() {
  return <LoginPage />;
}
