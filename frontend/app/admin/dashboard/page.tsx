"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Route, Users, Warehouse } from "lucide-react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CardStatistics } from "@/components/layout/CardStatistics";
import { HorizontalCardScroller } from "@/components/layout/HorizontalCardScroller";
import { TableHistory } from "@/components/layout/TableHistory";
import {
  getDashboardSummary,
  type DashboardCompany,
  type DashboardActivity,
  type DashboardStat,
} from "@/lib/dashboard-api";

export default function DashboardAdminPage() {
  const companiesScrollRef = useRef<HTMLDivElement>(null);
  const [companiesScrollProgress, setCompaniesScrollProgress] = useState(0);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [companies, setCompanies] = useState<DashboardCompany[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const handleCompaniesScroll = () => {
    if (!companiesScrollRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = companiesScrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setCompaniesScrollProgress(progress);
  };

  useEffect(() => {
    const companiesEl = companiesScrollRef.current;
    companiesEl?.addEventListener("scroll", handleCompaniesScroll);

    return () => {
      companiesEl?.removeEventListener("scroll", handleCompaniesScroll);
    };
  }, []);

  const statsWithIcons = stats.map((item) => {
    if (item.label.toLowerCase().includes("comp")) {
      return { ...item, icon: Building2 };
    }

    if (item.label.toLowerCase().includes("almac")) {
      return { ...item, icon: Warehouse };
    }

    if (item.label.toLowerCase().includes("usuario")) {
      return { ...item, icon: Users };
    }

    if (item.label.toLowerCase().includes("ruta")) {
      return { ...item, icon: Route };
    }

    return item;
  });

  const limitedRecentActivity = recentActivity.slice(0, 5);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const summary = await getDashboardSummary();
        if (!isMounted) {
          return;
        }

        setStats(summary.stats ?? []);
        setCompanies(summary.companies ?? []);
        setRecentActivity(summary.recentActivity ?? []);
      } catch {
        if (!isMounted) {
          return;
        }

        setStats([]);
        setCompanies([]);
        setRecentActivity([]);
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    };

    void loadDashboardSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ContentShell
      role="admin"
      title="Dashboard Admin"
      breadcrumbs={["Admin", "Dashboard"]}
    >
      <div className="flex flex-col text-[14px] md:text-[15px]" style={{ backgroundColor: "var(--color-background)" }}>
        <div className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
          <CardStatistics
            title="Estadisticas del sistema"
            description="Resumen general del sistema"
            items={statsWithIcons}
            isLoading={isLoadingSummary}
          />

          <HorizontalCardScroller
            title="Empresas"
            description={`${companies.length} empresas activas`}
            items={companies}
            isLoading={isLoadingSummary}
            loadingText="Cargando empresas..."
            emptyText="Aun no hay empresas registradas."
            scrollRef={companiesScrollRef}
            scrollProgress={companiesScrollProgress}
            linkHref="/admin/companies"
            linkLabel="Administrar empresas"
            renderCard={(company) => (
              <div
                key={company.id}
                className="group w-44 flex-none cursor-pointer overflow-hidden rounded-2xl border shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 md:w-48"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
              >
                <div className="h-1 w-full" style={{ backgroundColor: "var(--color-primary-500)" }} />

                <div className="flex flex-col items-center gap-4 px-4 py-5 md:px-5 md:py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--color-divider)" }}>
                    <Building2 size={22} style={{ color: "var(--color-primary-500)" }} />
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                      Empresa
                    </p>
                    <h3 className="mt-2 text-sm font-semibold leading-tight tracking-[0.02em] md:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
                      {company.name}
                    </h3>
                  </div>

                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center" style={{ borderColor: "var(--color-divider)" }}>
                    <Warehouse size={12} style={{ color: "var(--color-primary-500)" }} />
                    <p className="text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>
                      {company.warehousesCount} {company.warehousesCount === 1 ? "almacén" : "almacenes"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          />

          <TableHistory
            title="Actividad reciente"
            description="Ultimos movimientos administrativos"
            items={limitedRecentActivity}
            isLoading={isLoadingSummary}
          />
        </div>
      </div>
    </ContentShell>
  );
}
