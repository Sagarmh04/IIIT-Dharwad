"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  email: string;
  name?: string;
  picture?: string;
  id?: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchUser() {
    try {
      setLoading(true);
      const res = await fetch("/api/user");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setError(null);
      } else {
        setUser(null);
        if (res.status === 401) {
          router.push("/login");
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch user:", err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
