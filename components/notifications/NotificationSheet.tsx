"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area"; // You might need: npx shadcn-ui@latest add scroll-area

// Define types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: any;
}

export function NotificationSheet() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for notifications
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const clearNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other clicks
    await deleteDoc(doc(db, "notifications", id));
  };

  // Helper to get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="text-orange-500" size={20} />;
      case "error":
        return <XCircle className="text-red-500" size={20} />;
      case "success":
        return <CheckCircle2 className="text-green-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-3 bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white transition">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xl border-l border-white/20">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-primary text-white px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Notification List */}
        <div className="h-[calc(100vh-100px)] overflow-y-auto pr-4 space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Bell size={48} className="mx-auto mb-4 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((note) => (
              <div
                key={note.id}
                onClick={() => markAsRead(note.id)}
                className={`relative group p-4 rounded-2xl border transition-all cursor-pointer ${
                  note.read
                    ? "bg-white/40 border-transparent dark:bg-white/5"
                    : "bg-white border-blue-200 shadow-lg dark:bg-slate-800 dark:border-slate-700"
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      note.read
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-white shadow-sm"
                    }`}
                  >
                    {getIcon(note.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4
                        className={`text-sm font-semibold ${
                          !note.read && "text-primary"
                        }`}
                      >
                        {note.title}
                      </h4>
                      <button
                        onClick={(e) => clearNotification(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {note.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {note.createdAt?.toDate
                        ? formatDistanceToNow(note.createdAt.toDate(), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </p>
                  </div>
                </div>
                {!note.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
