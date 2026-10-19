"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { platformAuth, type PlatformUser } from "./platform-auth-client";

interface AuthContextValue {
  loading: boolean;
  refreshUser: () => Promise<PlatformUser | null>;
  signOut: () => Promise<void>;
  user: PlatformUser | null;
}

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  refreshUser: async () => null,
  signOut: async () => {},
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const result = await platformAuth.getUser();
    const nextUser = result.data?.user ?? null;
    setUser(nextUser);
    setLoading(false);
    return nextUser;
  }, []);

  useEffect(() => {
    void refreshUser();
    const subscription = platformAuth.onAuthStateChange((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => subscription.data.subscription.unsubscribe();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      refreshUser,
      signOut: async () => {
        setLoading(true);
        await platformAuth.signOut();
        setUser(null);
        setLoading(false);
      },
      user,
    }),
    [loading, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
