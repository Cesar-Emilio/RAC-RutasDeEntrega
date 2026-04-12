"use client";

import { useEffect, useRef, useState } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CompanyDashboardHeader } from "@/components/layout/CompanyDashboardHeader";
import {
  CompanyRoutesCards,
  type CompanyRouteCard,
} from "@/components/layout/CompanyRoutesCards";
import { TableHistory } from "@/components/layout/TableHistory";
import { WarehouseCards } from "@/components/layout/WarehouseCards";
import type { DashboardActivity, DashboardWarehouse } from "@/lib/dashboard-api";

export default function CompanyDashboardPage() {
  const warehousesScrollRef = useRef<HTMLDivElement>(null);
  const routesScrollRef = useRef<HTMLDivElement>(null);
  const [warehousesScrollProgress, setWarehousesScrollProgress] = useState(0);
  const [routesScrollProgress, setRoutesScrollProgress] = useState(0);

  const warehouses: DashboardWarehouse[] = [];
  const routes: CompanyRouteCard[] = [];
  const recentActivity: DashboardActivity[] = [];

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    setProgress: (value: number) => void,
  ) => {
    if (!ref.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setProgress(progress);
  };

  useEffect(() => {
    const warehousesEl = warehousesScrollRef.current;
    const routesEl = routesScrollRef.current;

    const handleWarehousesScroll = () => handleScroll(warehousesScrollRef, setWarehousesScrollProgress);
    const handleRoutesScroll = () => handleScroll(routesScrollRef, setRoutesScrollProgress);

    warehousesEl?.addEventListener("scroll", handleWarehousesScroll);
    routesEl?.addEventListener("scroll", handleRoutesScroll);

    return () => {
      warehousesEl?.removeEventListener("scroll", handleWarehousesScroll);
      routesEl?.removeEventListener("scroll", handleRoutesScroll);
    };
  }, []);

  return (
    <ContentShell
      role="company"
      title="Dashboard empresa"
      breadcrumbs={["Empresa", "Dashboard"]}
    >
      <div className="flex min-h-screen flex-col text-[14px] md:text-[15px]" style={{ backgroundColor: "#0f1115" }}>
        <CompanyDashboardHeader
          title="Dashboard"
          description="Panel de administracion de la empresa"
        />

        <div className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
          <WarehouseCards
            title="Almacenes"
            description={`${warehouses.length} almacenes activos`}
            items={warehouses}
            isLoading={false}
            scrollRef={warehousesScrollRef}
            scrollProgress={warehousesScrollProgress}
            linkHref="#"
            linkLabel="Administrar almacenes"
          />

          <CompanyRoutesCards
            title="Historial de rutas"
            description="Ultimas rutas calculadas"
            items={routes}
            isLoading={false}
            scrollRef={routesScrollRef}
            scrollProgress={routesScrollProgress}
            linkHref="#"
            linkLabel="Calcular nueva ruta"
          />

          <TableHistory
            title="Actividad reciente"
            description="Ultimos movimientos del sistema"
            items={recentActivity}
            isLoading={false}
          />
        </div>
      </div>
    </ContentShell>
  );
}
