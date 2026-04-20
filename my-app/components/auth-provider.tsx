"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthUser } from "@/lib/types";

const STORAGE_KEY = "tenderhub.auth.user";

interface AuthCtxValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, name?: string) => AuthUser;
  register: (name: string, email: string) => AuthUser;
  logout: () => void;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    (email: string, name?: string): AuthUser => {
      const cleanEmail = email.trim().toLowerCase();
      const fallbackName =
        name?.trim() ||
        cleanEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const u: AuthUser = {
        id: `u-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
        name: fallbackName,
        email: cleanEmail,
        role: cleanEmail.endsWith("@admin.tenderhub.ke") ? "admin" : "user",
      };
      persist(u);
      return u;
    },
    [persist],
  );

  const register = useCallback(
    (name: string, email: string): AuthUser => login(email, name),
    [login],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthCtxValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthCtxValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
