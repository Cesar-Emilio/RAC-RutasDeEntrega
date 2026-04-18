"use client";

import { useEffect, useState } from "react";
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

type SidebarProps = {
  role: SidebarRole;
};

const adminLinks: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Empresas", icon: Users },
  { href: "/admin/deliveries", label: "Entregas", icon: Route, isHighlighted: true },
];

const companyLinks: SidebarItem[] = [
  { href: "/company/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/company/warehouses", label: "Almacenes", icon: Warehouse },
  { href: "/company/deliveries", label: "Entregas", icon: Route, isHighlighted: true },
];

function getNavItemColor(isActive: boolean, isHighlighted?: boolean) {
  if (isActive) {
    return "var(--color-background)";
  }

  if (isHighlighted) {
    return "var(--color-primary-500)";
  }

  return "var(--color-text-secondary)";
}

function SidebarNavItem({
  item,
  isOpen,
  isActive,
}: Readonly<{
  item: SidebarItem;
  isOpen: boolean;
  isActive: boolean;
}>) {
  const Icon = item.icon;
  const itemColor = getNavItemColor(isActive, item.isHighlighted);

  return (
    <Link
      href={item.href}
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-3 transition-all duration-200 ${isOpen ? "" : "justify-center"}`}
      style={{
        backgroundColor: isActive ? "var(--color-primary-500)" : "transparent",
        borderLeft: isActive ? "3px solid var(--color-primary-500)" : "3px solid transparent",
        color: itemColor,
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
    </Link>
  );
}

export function Sidebar({ role }: Readonly<SidebarProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const links = role === "admin" ? adminLinks : companyLinks;
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  const roleHeading = role === "admin" ? "Admin" : "Empresa";
  const roleSubtitle = role === "admin" ? "Gestión del sistema" : "Gestión operativa";
  const sidebarWidthClass = isOpen ? "w-56" : "w-0 lg:w-16";
  const headerLayoutClass = isOpen ? "justify-between p-6 opacity-100" : "justify-center p-3 opacity-0 lg:opacity-100";
  const toggleLabel = isOpen ? "Colapsar menú" : "Expandir menú";
  const spacerWidthClass = isOpen ? "hidden lg:block lg:w-56" : "hidden lg:block lg:w-16";

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (!mounted) {
    return (
      <aside
        className="fixed top-0 left-0 z-50 h-screen w-56"
        style={{ backgroundColor: "var(--color-surface)" }}
      />
    );
  }

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
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarWidthClass}`}
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex h-full min-w-56 flex-col lg:min-w-0">
          <div className={`flex items-start gap-3 transition-opacity duration-300 ${headerLayoutClass}`}>
            {isOpen ? (
              <div>
                <h2 className="text-base font-bold tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  {roleHeading}
                </h2>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {roleSubtitle}
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
              aria-label={toggleLabel}
              title={toggleLabel}
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

                return (
                  <SidebarNavItem key={item.href} item={item} isOpen={isOpen} isActive={isActive} />
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

      <div className={`transition-all duration-300 ${spacerWidthClass}`} />
    </>
  );
}
