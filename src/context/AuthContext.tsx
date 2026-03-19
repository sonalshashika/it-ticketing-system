"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, microsoftProvider } from "@/lib/firebase/config";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  logout: async () => {},
  loginWithMicrosoft: async () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      
      if (fUser) {
        // Fetch additional user details from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ id: fUser.uid, uid: fUser.uid, ...data } as User);
          } else {
            // Auto-create profile for SSO / First-time login
            const userData: User = {
              id: fUser.uid,
              uid: fUser.uid,
              name: fUser.displayName || "Unknown User",
              email: fUser.email || "",
              role: "EMPLOYEE",
              department: "General",
              createdAt: new Date().toISOString()
            };
            
            // Persist to Firestore including the uid field
            await setDoc(doc(db, "users", fUser.uid), {
              uid: fUser.uid,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              department: userData.department,
              createdAt: serverTimestamp()
            });
            
            setUser(userData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      await signInWithPopup(auth, microsoftProvider);
    } catch (error) {
      console.error("Microsoft Login Error:", error);
      throw error;
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, loginWithMicrosoft, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
