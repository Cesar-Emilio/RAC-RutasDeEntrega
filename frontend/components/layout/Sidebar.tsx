"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Warehouse,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

type SidebarRole = "admin" | "company";

type SidebarItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isHighlighted?: boolean;
};

const adminLinks: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Empresas", icon: Users },
  { href: "/admin/routes", label: "Rutas", icon: Route, isHighlighted: true },
];

const companyLinks: SidebarItem[] = [
  { href: "/company/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/company/warehouses", label: "Almacenes", icon: Warehouse },
  { href: "/company/routes", label: "Rutas", icon: Route, isHighlighted: true },
];

export function Sidebar({ role }: { role: SidebarRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const links = role === "admin" ? adminLinks : companyLinks;
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-40 rounded-md p-2 lg:hidden ${isOpen ? "hidden" : "block"}`}
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "w-56" : "w-0 lg:w-16"
        }`}
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex h-full min-w-56 flex-col lg:min-w-0">
          <div
            className={`flex items-start gap-3 transition-opacity duration-300 ${
              isOpen ? "justify-between p-6 opacity-100" : "justify-center p-3 opacity-0 lg:opacity-100"
            }`}
          >
            {isOpen ? (
              <div>
                <h2 className="text-base font-bold tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  {role === "admin" ? "Admin" : "Empresa"}
                </h2>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {role === "admin" ? "Gestión del sistema" : "Gestión operativa"}
                </p>
              </div>
            ) : null}

            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-3 transition-all duration-200 ${
                isOpen ? "" : "justify-center"
              }`}
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(event) => (event.currentTarget.style.backgroundColor = "var(--color-divider)")}
              onMouseLeave={(event) => (event.currentTarget.style.backgroundColor = "transparent")}
              aria-label={isOpen ? "Colapsar menú" : "Expandir menú"}
              title={isOpen ? "Colapsar menú" : "Expandir menú"}
            >
              {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-3">
            {isOpen && (
              <h3 className="mb-4 px-3 text-xs font-bold" style={{ color: "var(--color-primary-500)" }}>
                MENÚ
              </h3>
            )}

            <div className="space-y-1">
              {links.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-all duration-200 ${
                        isOpen ? "" : "justify-center"
                      }`}
                      style={{
                        backgroundColor: isActive ? "var(--color-primary-500)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--color-primary-500)" : "3px solid transparent",
                        color: isActive ? "var(--color-background)" : item.isHighlighted ? "var(--color-primary-500)" : "var(--color-text-secondary)",
                      }}
                      onMouseEnter={(event) => {
                        if (!isActive) {
                          event.currentTarget.style.backgroundColor = "var(--color-divider)";
                        }
                      }}
                      onMouseLeave={(event) => {
                        if (!isActive) {
                          event.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <Icon size={20} className="shrink-0" />
                      {isOpen && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t p-4" style={{ borderColor: "var(--color-divider)" }}>
            <button
              onClick={handleLogout}
              className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-3 transition-all duration-200 ${
                isOpen ? "" : "justify-center"
              }`}
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(event) => (event.currentTarget.style.backgroundColor = "var(--color-divider)")}
              onMouseLeave={(event) => (event.currentTarget.style.backgroundColor = "transparent")}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={20} className="shrink-0" />
              {isOpen && <span className="text-sm">Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${isOpen ? "hidden lg:block lg:w-56" : "hidden lg:block lg:w-16"}`} />
    </>
  );
}
