"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Route, Warehouse } from "lucide-react";
import Link from "next/link";
import { ContentShell } from "@/components/layout/ContentShell";
import {
  CompanyRoutesCards,
  type CompanyRouteCard,
} from "@/components/layout/CompanyRoutesCards";
import { WarehouseCards } from "@/components/layout/WarehouseCards";
import {
  getDashboardSummary,
  type DashboardWarehouse,
} from "@/lib/dashboard-api";
import { getDeliveriesRequest } from "@/lib/routes-api";
import type { RouteTableItem } from "@/types/routes-types";

type WarehouseActivityRow = {
  id: number;
  name: string;
  routesCount: number;
  lastRoute: string;
  status: RouteTableItem["status"] | "empty";
  location: string;
};

function getStatusLabel(status: WarehouseActivityRow["status"]) {
  switch (status) {
    case "completed":
      return "Completado";
    case "processing":
      return "En proceso";
    case "pending":
      return "Pendiente";
    case "error":
      return "Con error";
    default:
      return "Sin actividad";
  }
}

function getStatusStyles(status: WarehouseActivityRow["status"]) {
  switch (status) {
    case "completed":
      return {
        backgroundColor: "rgba(34, 197, 94, 0.14)",
        color: "var(--color-success)",
      };
    case "processing":
      return {
        backgroundColor: "rgba(59, 130, 246, 0.14)",
        color: "var(--color-info)",
      };
    case "pending":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.14)",
        color: "var(--color-primary-500)",
      };
    case "error":
      return {
        backgroundColor: "rgba(239, 68, 68, 0.14)",
        color: "var(--color-error)",
      };
    default:
      return {
        backgroundColor: "rgba(148, 163, 184, 0.14)",
        color: "var(--color-text-muted)",
      };
  }
}

export default function CompanyDashboardPage() {
  const warehousesScrollRef = useRef<HTMLDivElement>(null);
  const routesScrollRef = useRef<HTMLDivElement>(null);
  const [warehousesScrollProgress, setWarehousesScrollProgress] = useState(0);
  const [routesScrollProgress, setRoutesScrollProgress] = useState(0);
  const [warehouses, setWarehouses] = useState<DashboardWarehouse[]>([]);
  const [routes, setRoutes] = useState<CompanyRouteCard[]>([]);
  const [deliveryRows, setDeliveryRows] = useState<RouteTableItem[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const routeStatusSummary = useMemo(() => {
    const completed = deliveryRows.filter((route) => route.status === "completed").length;
    const processing = deliveryRows.filter((route) => route.status === "processing").length;
    const pending = deliveryRows.filter((route) => route.status === "pending").length;
    const error = deliveryRows.filter((route) => route.status === "error").length;

    return [
      { label: "Completadas", value: completed },
      { label: "En proceso", value: processing },
      { label: "Pendientes", value: pending },
      { label: "Con error", value: error },
    ];
  }, [deliveryRows]);

  const latestRoute = routes[0] ?? null;

  const formatRouteDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const mapRouteCard = (route: RouteTableItem): CompanyRouteCard => ({
    id: route.id,
    packages: route.delivery_count,
    date: formatRouteDate(route.created_at),
    location: route.warehouse_name,
    status: route.status,
  });

  const skeletonActivityRows = useMemo<WarehouseActivityRow[]>(
    () =>
      Array.from({ length: 3 }, (_, index) => ({
        id: -index - 1,
        name: "",
        routesCount: 0,
        lastRoute: "",
        status: "empty",
        location: "",
      })),
    [],
  );

  const warehouseActivityRows = useMemo<WarehouseActivityRow[]>(() => {
    const routeBuckets = new Map<string, RouteTableItem[]>();

    for (const route of deliveryRows) {
      const bucket = routeBuckets.get(route.warehouse_name) ?? [];
      bucket.push(route);
      routeBuckets.set(route.warehouse_name, bucket);
    }

    return warehouses.map((warehouse) => {
      const warehouseRoutes = routeBuckets.get(warehouse.name) ?? [];
      const latestRoute = warehouseRoutes[0] ?? null;

      return {
        id: warehouse.id,
        name: warehouse.name,
        routesCount: warehouseRoutes.length,
        lastRoute: latestRoute ? formatRouteDate(latestRoute.created_at) : "Sin actividad",
        status: latestRoute?.status ?? "empty",
        location: warehouse.location,
      };
    });
  }, [deliveryRows, warehouses]);

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

  useEffect(() => {
    let isMounted = true;

    const loadDashboardSummary = async () => {
      try {
        setIsLoadingWarehouses(true);
        const summary = await getDashboardSummary();
        if (!isMounted) {
          return;
        }

        setWarehouses(summary.warehouses ?? []);
      } catch {
        if (!isMounted) {
          return;
        }

        setWarehouses([]);
      } finally {
        if (isMounted) {
          setIsLoadingWarehouses(false);
        }
      }
    };

    void loadDashboardSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDeliveries = async () => {
      try {
        setIsLoadingRoutes(true);
        setIsLoadingActivity(true);
        const data = await getDeliveriesRequest();
        if (!isMounted) {
          return;
        }

        setDeliveryRows(data);
        setRoutes(data.slice(0, 5).map(mapRouteCard));
      } catch {
        if (!isMounted) {
          return;
        }

        setDeliveryRows([]);
        setRoutes([]);
      } finally {
        if (isMounted) {
          setIsLoadingRoutes(false);
          setIsLoadingActivity(false);
        }
      }
    };

    void loadDeliveries();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ContentShell
      role="company"
      title="Dashboard empresa"
      breadcrumbs={["Empresa", "Dashboard"]}
    >
      <div className="flex flex-col text-[14px] md:text-[15px]" style={{ backgroundColor: "var(--color-background)" }}>
        <div className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
          <div className="space-y-6">
            <section className="min-w-0 rounded-2xl border px-4 py-4 md:px-5 md:py-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}>
              <div className="-mx-4 -mt-4 mb-4 h-1 rounded-t-2xl md:-mx-5 md:-mt-5" style={{ backgroundColor: "var(--color-primary-500)" }} />
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                      Resumen de entregas
                  </h2>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Resumen rápido de la actividad del sistema
                  </p>
                </div>

                <Link href="/company/new-delivery" className="shrink-0 text-sm font-medium hover:underline" style={{ color: "var(--color-primary-500)" }}>
                  Calcular nueva ruta de entrega
                </Link>
              </div>

              <CompanyRoutesCards
                title=""
                description=""
                items={routes}
                isLoading={isLoadingRoutes}
                hideHeader
                scrollRef={routesScrollRef}
                scrollProgress={routesScrollProgress}
                linkHref={undefined}
                linkLabel={undefined}
              />
            </section>

            <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
              <section className="min-w-0 h-full rounded-2xl border px-4 py-4 md:px-5 md:py-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}>
                <div className="-mx-4 -mt-4 mb-4 h-1 rounded-t-2xl md:-mx-5 md:-mt-5" style={{ backgroundColor: "var(--color-primary-500)" }} />
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                      Estado de almacenes
                    </h2>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {warehouses.length} almacenes activos
                    </p>
                  </div>

                  <Link href="/company/warehouses" className="shrink-0 text-sm font-medium hover:underline" style={{ color: "var(--color-primary-500)" }}>
                    Administrar almacenes
                  </Link>
                </div>

                <WarehouseCards
                  title=""
                  description=""
                  items={warehouses}
                  isLoading={isLoadingWarehouses}
                  hideHeader
                  scrollRef={warehousesScrollRef}
                  scrollProgress={warehousesScrollProgress}
                  linkHref={undefined}
                  linkLabel={undefined}
                />
              </section>

              <section className="min-w-0 h-full rounded-2xl border px-4 py-4 md:px-5 md:py-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}>
                <div className="-mx-4 -mt-4 mb-4 h-1 rounded-t-2xl md:-mx-5 md:-mt-5" style={{ backgroundColor: "var(--color-primary-500)" }} />
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                      Resumen de rutas
                    </h2>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Monitoreo operativo de entregas y estados de ruta
                    </p>
                  </div>
                </div>

                <div className="mb-3 rounded-2xl border px-4 py-4 md:px-5 md:py-5" style={{ backgroundColor: "var(--color-background)", borderColor: "var(--color-divider)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--color-text-muted)" }}>
                        Total rutas
                      </p>
                      <p className="mt-2 text-3xl font-semibold leading-none" style={{ color: "var(--color-text-secondary)" }}>
                        {isLoadingRoutes ? "--" : routes.length}
                      </p>
                      <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        Estado consolidado de las rutas registradas
                      </p>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ backgroundColor: "rgba(255, 139, 31, 0.12)", borderColor: "var(--color-divider)" }}>
                      <Route size={24} style={{ color: "var(--color-primary-500)" }} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {routeStatusSummary.map((item) => {
                    const IconComponent = item.label === "Completadas" ? CheckCircle2 : item.label === "Con error" ? AlertCircle : Clock3;

                    return (
                      <div key={item.label} className="rounded-xl border px-4 py-2.5" style={{ backgroundColor: "var(--color-background)", borderColor: "var(--color-divider)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
                            {item.label}
                          </p>
                          <IconComponent size={13} style={{ color: "var(--color-primary-500)" }} />
                        </div>
                        <p className="mt-1.5 text-xl leading-none font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                          {isLoadingActivity ? "--" : item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className="min-w-0">
              <h2 className="mb-1 text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                Actividad por almacén
              </h2>
              <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Registro operativo de rutas por cada almacén
              </p>

              <div
                className="overflow-hidden rounded-xl border"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-190 w-full">
                    <thead>
                      <tr style={{ backgroundColor: "var(--color-surface)" }}>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                          Almacén
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                          Rutas generadas
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                          Última ruta
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                          Estado actual
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isLoadingActivity ? skeletonActivityRows : warehouseActivityRows).length > 0 ? (
                          (isLoadingActivity ? skeletonActivityRows : warehouseActivityRows).map((row) => (
                          <tr
                            key={row.id}
                            className="border-t"
                            style={{ borderColor: "var(--color-divider)" }}
                          >
                            <td className="px-3 py-2.5">
                              {isLoadingActivity ? (
                                <div className="h-4 w-40 rounded-full" style={{ backgroundColor: "var(--color-background)" }} />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-background)" }}>
                                    <Warehouse size={15} style={{ color: "var(--color-primary-500)" }} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                      {row.name}
                                    </p>
                                    <p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
                                      {row.location}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle">
                              {isLoadingActivity ? (
                                <div className="mx-auto h-4 w-12 rounded-full" style={{ backgroundColor: "var(--color-background)" }} />
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-secondary)" }}>
                                  <Route size={12} style={{ color: "var(--color-primary-500)" }} />
                                  {row.routesCount}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle">
                              {isLoadingActivity ? (
                                <div className="mx-auto h-4 w-24 rounded-full" style={{ backgroundColor: "var(--color-background)" }} />
                              ) : (
                                <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                  <Clock3 size={12} style={{ color: "var(--color-text-muted)" }} />
                                  {row.lastRoute}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center align-middle">
                              {isLoadingActivity ? (
                                <div className="mx-auto h-5 w-20 rounded-full" style={{ backgroundColor: "var(--color-background)" }} />
                              ) : (
                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                                  style={getStatusStyles(row.status)}
                                >
                                  {getStatusLabel(row.status)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }} colSpan={4}>
                            Aun no hay actividad por almacén.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ContentShell>
  );
}
