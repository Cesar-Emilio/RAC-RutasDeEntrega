"use client";

import { useEffect, useState } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { Filters } from "@/components/deliveries/filters";
import { RoutesTable } from "@/components/deliveries/routes-table";
import { useRouter } from "next/navigation";
import { getDeliveriesRequest } from "@/lib/routes-api";
import { RouteTableItem } from "@/types/routes-types";
import { useAlert } from "@/components/layout/AlertProvider";

export default function CompanyRoutesPage() {
  const router = useRouter();
  const { addAlert } = useAlert();

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
      } catch (err: unknown) {
        addAlert("error", "Error al cargar la tabla de entregas");
        const message = err instanceof Error ? err.message : "Error al cargar las entregas";
        setError(message)
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
    router.push("/company/new-delivery")
  };

  const handleViewRoute = (route: RouteTableItem) => {
    router.push(`/company/deliveries/${route.id}`)
  };

  return (
    <ContentShell
      role="company"
      title="Historial de entregas"
      breadcrumbs={["Empresa", "Entregas"]}
    >
      <div className="space-y-6">
        <Filters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onNewRoute={handleNewRoute}
        />

        {error ? (
          <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-secondary">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <RoutesTable data={filteredRoutes} onViewRoute={handleViewRoute} isLoading={loading} />
        </div>
      </div>
    </ContentShell>
  );
}
