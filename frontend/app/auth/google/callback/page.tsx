"use client";

import { useEffect } from "react";
import { authStorage } from "@/lib/auth-storage";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access && refresh) {
      authStorage.setTokens({ access, refresh }, true);
    }

    window.location.replace("/");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] text-white">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-sm text-[var(--color-text-primary)]">
        Procesando inicio de sesion con Google...
      </div>
    </div>
  );
}
