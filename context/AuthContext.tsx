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

// ... (Interfaces remain the same) ...
interface UserData {
  role: "admin" | "user";
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
          // User is signed in
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);

            if (data.role === "user" && data.outletId) {
              setCurrentOutletId(data.outletId);
            }
          }
          setUser(firebaseUser);
        } else {
          // User is signed out
          setUser(null);
          setUserData(null);
          setCurrentOutletId(null);
        }
      } catch (error) {
        console.error("Auth Context Error:", error);
        // Optional: If error happens, treat as logged out to unblock UI
        setUser(null);
      } finally {
        // CRITICAL: This ensures loading ALWAYS turns false, preventing the infinite loop
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
      {!loading && children}
    </AuthContext.Provider>
  );
}
