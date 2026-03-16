"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface UserData {
  role: "admin" | "tenant"; // FIX 1: Updated to match your database roles
  outletId?: string;
  email: string;
  photoURL?: string;
  phone?: string;
  smartDbId: string;
  uid: string;
  firstName: string;
  lastName: string;
  address: string;
  onboarded: boolean;
  historicalBills: number[];
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  currentOutletId: string | null;
  setCurrentOutletId: Dispatch<SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
  currentOutletId: null,
  setCurrentOutletId: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOutletId, setCurrentOutletId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);

            if (data.role === "tenant" && data.outletId) {
              setCurrentOutletId(data.outletId);
            }
          }
          setUser(firebaseUser);
        } else {
          setUser(null);
          setUserData(null);
          setCurrentOutletId(null);
        }
      } catch (error) {
        console.error("Auth Context Error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        logout,
        currentOutletId,
        setCurrentOutletId,
      }}
    >
      {/* FIX 2: Let children render immediately so AuthGuard can show its spinner */}
      {children}
    </AuthContext.Provider>
  );
}
