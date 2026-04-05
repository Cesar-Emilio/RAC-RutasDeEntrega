"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access && refresh) {
      authStorage.setTokens({ access, refresh }, true);
    }

    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1217] text-white">
      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] px-6 py-4 text-sm text-[#e5e7eb]">
        Procesando inicio de sesion con Google...
      </div>
    </div>
  );
}
