"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { useRouter } from "next/navigation";
import { getDeliveriesRequest } from "@/lib/routes-api";
import { RouteTableItem } from "@/types/routes-types";
import { useAlert } from "@/components/layout/AlertProvider";

export default function AdminDeliveriesPage() {
  const router = useRouter();
  const { addAlert } = useAlert();

  const [routes, setRoutes] = useState<RouteTableItem[]>([]);
  const [selectedRouteByCompany, setSelectedRouteByCompany] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  const companyDeliveries = useMemo(() => {
    const grouped = new Map<string, RouteTableItem[]>();

    for (const route of routes) {
      const companyName = route.company_name?.trim() || "Empresa no disponible";
      const companyRoutes = grouped.get(companyName) ?? [];
      companyRoutes.push(route);
      grouped.set(companyName, companyRoutes);
    }

    return Array.from(grouped.entries())
      .map(([companyName, deliveries]) => ({
        companyName,
        deliveries,
      }))
      .sort((a, b) => b.deliveries.length - a.deliveries.length);
  }, [routes]);

  const totalPages = Math.max(1, Math.ceil(companyDeliveries.length / pageSize));

  const paginatedCompanyDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return companyDeliveries.slice(startIndex, startIndex + pageSize);
  }, [companyDeliveries, currentPage]);

  useEffect(() => {
    setSelectedRouteByCompany((previous) => {
      const next: Record<string, number> = {};

      for (const group of companyDeliveries) {
        const hasPreviousSelection = group.deliveries.some(
          (route) => route.id === previous[group.companyName],
        );

        next[group.companyName] = hasPreviousSelection
          ? previous[group.companyName]
          : group.deliveries[0].id;
      }

      return next;
    });
  }, [companyDeliveries]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [companyDeliveries]);

  const handleViewRoute = (route: RouteTableItem) => {
    router.push(`/admin/deliveries/${route.id}`);
  };

  return (
    <ContentShell
      role="admin"
      title="Historial de entregas"
      breadcrumbs={["Admin", "Entregas"]}
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-secondary">
            {error}
          </div>
        ) : null}

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-text-primary md:text-lg">
              Entregas por empresa
            </h2>
            <p className="text-sm text-text-secondary">
              Vista consolidada de entregas agrupadas por empresa
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-140">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">Empresa</th>
                    <th className="w-32 px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">Total entregas</th>
                    <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">Entregas realizadas</th>
                    <th className="w-32 px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                        Cargando resumen por empresa...
                      </td>
                    </tr>
                  ) : companyDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                        No hay entregas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    paginatedCompanyDeliveries.map((group) => {
                      const selectedRouteId = selectedRouteByCompany[group.companyName] ?? group.deliveries[0].id;
                      const selectedRoute = group.deliveries.find((route) => route.id === selectedRouteId) ?? group.deliveries[0];

                      return (
                        <tr key={group.companyName} className="border-t border-border align-top transition-colors hover:bg-surface" style={{ borderColor: "var(--color-divider)" }}>
                          <td className="px-3 py-2.5 text-center align-middle text-xs font-medium text-text-primary">
                            {group.companyName}
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle text-xs text-text-primary">
                            {group.deliveries.length}
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle text-xs text-text-secondary">
                            <div className="mx-auto w-full max-w-96">
                            <select
                              value={selectedRoute.id}
                              onChange={(event) => {
                                const selectedId = Number(event.target.value);
                                setSelectedRouteByCompany((previous) => ({
                                  ...previous,
                                  [group.companyName]: selectedId,
                                }));
                              }}
                              className="w-full rounded-md border border-divider bg-background px-3 py-1.5 text-sm text-text-primary outline-none focus:border-primary-500"
                            >
                              {group.deliveries.map((route) => (
                                <option key={`${group.companyName}-${route.id}`} value={route.id}>
                                  Ruta #{route.id} - {route.warehouse_name}
                                </option>
                              ))}
                            </select>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleViewRoute(selectedRoute)}
                              className="inline-flex h-7 items-center rounded-md border border-primary-500/30 bg-primary-500/10 px-3 text-xs font-medium text-primary-400 hover:bg-primary-500/20 cursor-pointer"
                            >
                              Ir a detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {companyDeliveries.length > 0 ? (
              <div className="border-t px-3 py-2" style={{ borderColor: "var(--color-divider)" }}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    Mostrando {Math.min((currentPage - 1) * pageSize + 1, companyDeliveries.length)}-{Math.min(currentPage * pageSize, companyDeliveries.length)} de {companyDeliveries.length}
                  </p>

                  <div className="inline-flex items-center gap-0.5 rounded-full border px-1 py-0.5" style={{ borderColor: "var(--color-divider)", backgroundColor: "var(--color-background)" }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: "transparent", color: "var(--color-text-primary)", backgroundColor: "transparent" }}
                      aria-label="Página anterior"
                      title="Página anterior"
                    >
                      <span className="text-xs">‹</span>
                    </button>

                    <div className="min-w-14 rounded-full px-2 py-0.5 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
                      <span className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        {currentPage}
                      </span>
                      <span className="mx-0.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        /
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        {totalPages}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: "transparent", color: "var(--color-text-primary)", backgroundColor: "transparent" }}
                      aria-label="Página siguiente"
                      title="Página siguiente"
                    >
                      <span className="text-xs">›</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </ContentShell>
  );
}
