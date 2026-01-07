import ForgotPasswordPage from "@/components/auth/forgot-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Forgot password page",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
