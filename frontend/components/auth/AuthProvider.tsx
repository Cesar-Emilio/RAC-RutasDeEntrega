"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthRole, AuthTokens, AuthUser } from "@/lib/auth-types";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  normalizeTokens,
  refreshRequest,
} from "@/lib/auth-api";
import { authStorage } from "@/lib/auth-storage";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: AuthRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const storedTokens = authStorage.getTokens();
      const storedUser = authStorage.getUser();
      if (!storedTokens) {
        setStatus("unauthenticated");
        return;
      }

      setTokens(storedTokens);
      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const persist = authStorage.isPersistent();
        const meResponse = await meRequest(storedTokens.access);
        if (meResponse.status === "success" && meResponse.data) {
          authStorage.setUser(meResponse.data.user, persist);
          setUser(meResponse.data.user);
          setStatus("authenticated");
          return;
        }
      } catch {
        try {
          const persist = authStorage.isPersistent();
          const refreshed = await refreshRequest(storedTokens.refresh);
          if (refreshed.status === "success" && refreshed.data) {
            const nextTokens = normalizeTokens(
              refreshed.data.access,
              storedTokens.refresh,
            );
            authStorage.setTokens(nextTokens, persist);
            setTokens(nextTokens);
            const meResponse = await meRequest(nextTokens.access);
            if (meResponse.status === "success" && meResponse.data) {
              authStorage.setUser(meResponse.data.user, persist);
              setUser(meResponse.data.user);
              setStatus("authenticated");
              return;
            }
          }
        } catch {
          authStorage.clearAll();
        }
      }

      authStorage.clearAll();
      setTokens(null);
      setUser(null);
      setStatus("unauthenticated");
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const response = await loginRequest(email, password);
    if (response.status !== "success" || !response.data) {
      throw response;
    }

    const nextTokens = normalizeTokens(
      response.data.access,
      response.data.refresh,
    );
    authStorage.setTokens(nextTokens, remember);
    authStorage.setUser(response.data.user, remember);
    setTokens(nextTokens);
    setUser(response.data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    if (tokens?.access) {
      try {
        await logoutRequest(tokens.access);
      } catch {
        // Ignore logout errors since tokens are removed locally.
      }
    }
    authStorage.clearAll();
    setTokens(null);
    setUser(null);
    setStatus("unauthenticated");
  }, [tokens]);

  const hasRole = useCallback((roles: AuthRole[]) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(
    () => ({ status, user, tokens, login, logout, hasRole }),
    [status, user, tokens, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
