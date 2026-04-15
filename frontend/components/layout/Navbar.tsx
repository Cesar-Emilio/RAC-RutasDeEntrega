"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function Navbar({
  title,
  breadcrumbs,
}: {
  title: string;
  breadcrumbs: string[];
}) {
  const { user } = useAuth();
  const name = user?.name || user?.email || "Usuario";
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/95 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            {breadcrumbs.join(" / ")}
          </nav>
          <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Sesion activa</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-sm font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
