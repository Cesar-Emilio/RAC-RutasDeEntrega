"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const roleRoutes: Record<string, string> = {
  admin: "/admin/dashboard",
  company: "/company/dashboard",
};

export function useRoleRedirect(redirectTo = "/login") {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status !== "authenticated" || !user?.role) return;
    const target = roleRoutes[user.role] || redirectTo;
    router.replace(target);
  }, [status, user, router, redirectTo]);
}
