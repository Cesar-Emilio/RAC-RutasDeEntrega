"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Route, Users, Warehouse } from "lucide-react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CardStatistics } from "@/components/layout/CardStatistics";
import { WarehouseCards } from "@/components/layout/WarehouseCards";
import { TableHistory } from "@/components/layout/TableHistory";
import {
  getDashboardSummary,
  type DashboardActivity,
  type DashboardStat,
  type DashboardWarehouse,
} from "@/lib/dashboard-api";

export default function DashboardAdminPage() {
  const warehousesScrollRef = useRef<HTMLDivElement>(null);
  const [warehousesScrollProgress, setWarehousesScrollProgress] = useState(0);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [warehouses, setWarehouses] = useState<DashboardWarehouse[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const handleWarehousesScroll = () => {
    if (!warehousesScrollRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = warehousesScrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setWarehousesScrollProgress(progress);
  };

  useEffect(() => {
    const warehousesEl = warehousesScrollRef.current;
    warehousesEl?.addEventListener("scroll", handleWarehousesScroll);

    return () => {
      warehousesEl?.removeEventListener("scroll", handleWarehousesScroll);
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
        setWarehouses(summary.warehouses ?? []);
        setRecentActivity(summary.recentActivity ?? []);
      } catch {
        if (!isMounted) {
          return;
        }

        setStats([]);
        setWarehouses([]);
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

          <WarehouseCards
            title="Almacenes"
            description={`${warehouses.length} almacenes activos`}
            items={warehouses}
            isLoading={isLoadingSummary}
            scrollRef={warehousesScrollRef}
            scrollProgress={warehousesScrollProgress}
            linkHref="/admin/companies"
            linkLabel="Administrar almacenes"
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
