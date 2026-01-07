"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export function AlertMonitor() {
  const { userData, user } = useAuth();

  // We use refs to track the previous state so we don't spam alerts on every render
  const prevStatusRef = useRef<string>("active");

  useEffect(() => {
    // Only run if we have a user and they are assigned to an outlet
    if (!userData || !userData.outletId) return;

    const unsub = onSnapshot(doc(db, "outlets", userData.outletId), (doc) => {
      const data = doc.data();
      if (!data) return;

      const currentStatus = data.status; // "active", "cutoff", "overload"
      const prevStatus = prevStatusRef.current;

      // Check for Status Change: Active -> Cutoff
      if (currentStatus === "cutoff" && prevStatus !== "cutoff") {
        triggerAlert(
          userData.email,
          "Power Cutoff",
          "Your allocated energy units have been exhausted. Power has been cut."
        );
      }

      // Check for Status Change: Active -> Overload
      if (currentStatus === "overload" && prevStatus !== "overload") {
        triggerAlert(
          userData.email,
          "System Overload",
          "A critical overload was detected. Please disconnect heavy appliances immediately."
        );
      }

      // Check specifically for Low Balance (e.g., 90% used)
      if (
        data.billingEnabled &&
        data.currentUsage / data.unitLimit > 0.9 &&
        prevStatus !== "warning"
      ) {
        toast.warning("Warning: You have used 90% of your allocated units.");
      }

      prevStatusRef.current = currentStatus;
    });

    return () => unsub();
  }, [userData]);

  const triggerAlert = async (email: string, type: string, message: string) => {
    // 1. Show Toast
    toast.error(type, { description: message, duration: 8000 });

    // 2. Send Email
    await fetch("/api/send-alert", {
      method: "POST",
      body: JSON.stringify({ email, type, message }),
    });

    // 3. SAVE TO DATABASE (For the Notification Sheet) <--- ADD THIS
    if (userData && userData.outletId) {
      // or use the user's UID
      await addDoc(collection(db, "notifications"), {
        userId: user?.uid, // Make sure 'user' is available from useAuth
        title: type,
        message: message,
        type: type === "System Overload" ? "error" : "warning",
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  };

  return null; // This component renders nothing visibly
}
