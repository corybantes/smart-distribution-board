import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function triggerAlert(
  userId: string,
  email: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
) {
  try {
    // 1. Write to Firestore (This instantly triggers your NotificationSheet UI)
    await adminDb.collection("notifications").add({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Send the Email securely
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SMART_DB_API_SECRET}`,
      },
      body: JSON.stringify({ email, type: title, message }),
    });
  } catch (error) {
    console.error("Failed to trigger alert:", error);
  }
}
