"use client"

import { fetchProfile } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserJSON } from "@/types/user";
import { InstitutionalAccountJSON } from "@/types/institutionalAccount";

export type AuthContextValue = { user: UserJSON | InstitutionalAccountJSON | null; loading: boolean };
export const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserJSON | InstitutionalAccountJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const callback = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const profile = await fetchProfile(firebaseUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    return onAuthStateChanged(auth, callback);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}