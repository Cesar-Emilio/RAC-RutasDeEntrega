"use client";

import { useEffect, useState } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { Filters } from "@/components/routes/filters";
import { RoutesTable, type RouteData } from "@/components/routes/routes-table";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";
import { getDeliveriesRequest } from "@/lib/routes-api";

export default function CompanyRoutesPage() {
  const router = useRouter();

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoading(true);
        setError(null);

        const token = authStorage.getTokens()?.access
        if(!token) {
          throw new Error("No auth")
        }

        const data = await getDeliveriesRequest(token);

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
      route.almacen.toLowerCase().includes(searchValue.toLowerCase()) ||
      route.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      route.archivo.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus = statusFilter === "all" || true;

    return matchesSearch && matchesStatus;
  });

  const handleNewRoute = () => {
    router.push("/company/new-route")
  };

  const handleViewRoute = (route: RouteData) => {
    router.push(`/company/${route.id}`)
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

        <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827]">
          <RoutesTable data={filteredRoutes} onViewRoute={handleViewRoute} />
        </div>
      </div>
    </ContentShell>
  );
}
