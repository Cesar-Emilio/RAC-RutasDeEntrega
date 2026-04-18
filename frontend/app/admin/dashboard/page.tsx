"use client";

import { useRef } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CardStatistics } from "@/components/layout/CardStatistics";
import { WarehouseCards } from "@/components/layout/WarehouseCards";
import { TableHistory } from "@/components/layout/TableHistory";

export default function DashboardAdminPage() {
  const warehousesScrollRef = useRef<HTMLDivElement>(null);
  const warehousesScrollProgress = 0;

  return (
    <ContentShell
      role="admin"
      title="Dashboard Admin"
      breadcrumbs={["Admin", "Dashboard"]}
    >
      <div
        className="flex min-h-screen flex-col text-[14px] md:text-[15px]"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
          <CardStatistics
            title="Estadisticas del sistema"
            description="Resumen general del sistema"
            items={[]}
            isLoading={false}
          />

          <WarehouseCards
            title="Almacenes"
            description="Lista de almacenes"
            items={[]}
            isLoading={false}
            scrollRef={warehousesScrollRef}
            scrollProgress={warehousesScrollProgress}
            linkHref="/admin/companies"
            linkLabel="Administrar almacenes"
          />

          <TableHistory
            title="Actividad reciente"
            description="Ultimos movimientos administrativos"
            items={[]}
            isLoading={false}
          />
        </div>
      </div>
    </ContentShell>
  );
}
