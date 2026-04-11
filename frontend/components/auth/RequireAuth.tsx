"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AuthRole } from "@/lib/auth-types";
import { useAuth } from "./AuthProvider";

export function RequireAuth({
  children,
  roles,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  roles?: AuthRole[];
  redirectTo?: string;
}) {
  const router = useRouter();
  const { status, hasRole } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(redirectTo);
    }
    if (status === "authenticated" && roles && !hasRole(roles)) {
      router.replace(redirectTo);
    }
  }, [status, roles, hasRole, router, redirectTo]);

  if (status !== "authenticated") {
    return null;
  }

  if (roles && !hasRole(roles)) {
    return null;
  }

  return <>{children}</>;
}
