"use client";

import { useEffect, useState } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { Filters } from "@/components/routes/filters";
import { RoutesTable } from "@/components/routes/routes-table";
import { useRouter } from "next/navigation";
import { getDeliveriesRequest } from "@/lib/routes-api";
import { RouteTableItem } from "@/types/routes-types";

export default function CompanyRoutesPage() {
  const router = useRouter();

  const [routes, setRoutes] = useState<RouteTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoading(true);
        setError(null);

        const data = await getDeliveriesRequest();
        setRoutes(data);
      } catch (err:any) {
        setError(err?.message || "Error al cargar las rutas")
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, [])

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      searchValue === "" ||
      route.warehouse_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      route.id === Number(searchValue) ||
      route.file_name.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus = statusFilter === "all" || true;

    return matchesSearch && matchesStatus;
  });

  const handleNewRoute = () => {
    router.push("/company/new-route")
  };

  const handleViewRoute = (route: RouteTableItem) => {
    router.push(`/company/routes/${route.id}`)
  };

  return (
    <ContentShell
      role="company"
      title="Historial de rutas"
      breadcrumbs={["Empresa", "Rutas"]}
    >
      <div className="space-y-6">
        <Filters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onNewRoute={handleNewRoute}
        />

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <RoutesTable data={filteredRoutes} onViewRoute={handleViewRoute} />
        </div>
      </div>
    </ContentShell>
  );
}
