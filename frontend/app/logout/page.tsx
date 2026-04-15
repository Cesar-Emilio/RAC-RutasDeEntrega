"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      router.replace("/login");
    };

    void performLogout();
  }, [logout, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
      <div className="rounded-3xl border border-[var(--color-border)] bg-white px-6 py-4 text-sm font-medium text-[var(--color-text-secondary)]">
        Signing out...
      </div>
    </div>
  );
}
