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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1ea]">
      <div className="rounded-3xl border border-[#e6dfd4] bg-white px-6 py-4 text-sm font-medium text-[#3b342f]">
        Signing out...
      </div>
    </div>
  );
}
