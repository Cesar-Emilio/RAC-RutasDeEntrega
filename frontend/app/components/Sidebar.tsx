"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Warehouse,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard/companies", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/companies/routes",
    label: "Historial de rutas",
    icon: Route,
  },
  {
    href: "/dashboard/companies/warehouses",
    label: "Almacenes",
    icon: Warehouse,
  },
  {
    href: "/dashboard/companies/new-route",
    label: "Nueva ruta",
    icon: PlusCircle,
    isHighlighted: true,
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    // TODO: implementa tu logout aquí
    console.log("logout");
  };

  if (!mounted) {
    return (
      <aside
        className="fixed top-0 left-0 h-screen z-50 w-56"
        style={{ backgroundColor: "#161A20" }}
      />
    );
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-40 p-2 rounded-md lg:hidden ${
          isOpen ? "hidden" : "block"
        }`}
        style={{ backgroundColor: "#161A20", color: "#BBBDC0" }}
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? "w-56" : "w-0 lg:w-16"
        } overflow-hidden`}
        style={{ backgroundColor: "#161A20" }}
      >
        <div className="flex flex-col h-full min-w-56 lg:min-w-0">
          {/* Header */}
          <div
            className={`
              transition-opacity duration-300
              ${isOpen ? "opacity-100 p-6" : "opacity-0 lg:opacity-100 p-3"}
              flex items-start
              ${isOpen ? "justify-between" : "justify-center"}
              gap-3
            `}
          >
            {/* Título solo en expandido */}
            {isOpen ? (
              <div>
                <h2
                  className="text-base font-bold tracking-wide"
                  style={{ color: "#BBBDC0" }}
                >
                  Empresa
                </h2>
                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  Logística de rutas
                </p>
              </div>
            ) : null}

            {/* Toggle (centrado cuando está colapsado) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`
                flex items-center gap-3 rounded-md transition-all duration-200
                px-3 py-3 min-h-[44px]
                ${isOpen ? "" : "justify-center"}
              `}
              style={{ color: "#BBBDC0" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#252a33")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              aria-label={isOpen ? "Colapsar menú" : "Expandir menú"}
              title={isOpen ? "Colapsar menú" : "Expandir menú"}
            >
              {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-3">
            {isOpen && (
              <h3
                className="text-xs font-bold mb-4 px-3"
                style={{ color: "#E27D2A" }}
              >
                MENÚ
              </h3>
            )}

            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 cursor-pointer min-h-[44px] ${
                        isOpen ? "" : "justify-center"
                      }`}
                      style={{
                        backgroundColor: isActive ? "#4a2c18" : "transparent",
                        borderLeft: isActive
                          ? "3px solid #E27D2A"
                          : "3px solid transparent",
                        color: item.isHighlighted
                          ? "#E27D2A"
                          : isActive
                          ? "#E27D2A"
                          : "#BBBDC0",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "#252a33";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {isOpen && (
                        <span className="text-sm font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer - Logout */}
          <div className="p-4 border-t" style={{ borderColor: "#252a33" }}>
            <button
              onClick={handleLogout}
              className={`
                flex items-center gap-3 w-full rounded-md transition-all duration-200
                px-3 py-3 min-h-[44px]
                ${isOpen ? "" : "justify-center"}
              `}
              style={{ color: "#BBBDC0" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#252a33")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={20} className="flex-shrink-0" />
              {isOpen && <span className="text-sm">Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer */}
      <div
        className={`transition-all duration-300 ${
          isOpen ? "hidden lg:block lg:w-56" : "hidden lg:block lg:w-16"
        }`}
      />
    </>
  );
}