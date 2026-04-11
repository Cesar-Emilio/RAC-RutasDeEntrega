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
    <header className="border-b border-[#1f2937] bg-[#0f1217]/95 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
            {breadcrumbs.join(" / ")}
          </nav>
          <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/logout"
            className="rounded-full border border-[#1f2937] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e5e7eb] transition hover:bg-[#111827]"
          >
            Cerrar sesion
          </Link>
          <div className="text-right">
            <p className="text-sm font-medium text-[#e5e7eb]">{name}</p>
            <p className="text-xs text-[#9ca3af]">Sesion activa</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316] text-sm font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
