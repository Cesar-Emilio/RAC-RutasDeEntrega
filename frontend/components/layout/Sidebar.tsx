"use client";

import Link from "next/link";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/companies", label: "Empresas" },
  { href: "/admin/routes", label: "Rutas" },
];

const companyLinks = [
  { href: "/company/dashboard", label: "Dashboard" },
  { href: "/company/warehouses", label: "Almacenes" },
  { href: "/company/routes", label: "Rutas" },
];

export function Sidebar({ role }: { role: "admin" | "company" }) {
  const links = role === "admin" ? adminLinks : companyLinks;

  return (
    <aside className="flex h-full flex-col border-r border-[#1f2937] bg-[#0e1116] px-6 py-8">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f97316]">
        RAC
      </div>
      <p className="mt-2 text-xs text-[#9ca3af]">
        {role === "admin" ? "Panel administrador" : "Panel empresa"}
      </p>
      <nav className="mt-8 space-y-2">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-[#e5e7eb] transition hover:bg-[#111827]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <Link
          href="/logout"
          className="mt-6 block rounded-lg border border-[#1f2937] px-3 py-2 text-sm text-[#e5e7eb] transition hover:bg-[#111827]"
        >
          Cerrar sesion
        </Link>
      </div>
    </aside>
  );
}
