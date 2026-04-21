"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { RouteTableItem } from "@/types/routes-types";
import { ChevronLeft, ChevronRight, MapPin, Power } from "lucide-react";

interface RoutesTableProps {
  readonly data: RouteTableItem[];
  readonly onViewRoute: (route: RouteTableItem) => void;
  readonly isLoading?: boolean;
  readonly pageSize?: number;
  readonly onDeleteRoute: (route: RouteTableItem) => void;
}

export function RoutesTable({ data, onViewRoute, onDeleteRoute, isLoading = false, pageSize = 5 }: RoutesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(data.length / safePageSize));

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * safePageSize;
    return data.slice(startIndex, startIndex + safePageSize);
  }, [currentPage, data, safePageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, safePageSize]);

  return (
    <div className="">
      <div className="overflow-x-auto rounded-xl bg-surface border border-border">
        <table className="w-full min-w-160">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">
                ID
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">
                Fecha
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">
                Almacen
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">
                Paquetes
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">
                Archivo
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-light">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8">
                  <div className="flex min-h-55 flex-col items-center justify-center gap-4 text-secondary">
                    <LoadingSpinner className="h-12 w-12" />
                    <p className="text-sm font-medium">Cargando entregas...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.map((route, index) => (
              <tr
                key={`${route.id}-${index}`}
                className="border-t border-border transition-colors duration-150 hover:bg-surface"
                style={{ borderColor: "var(--color-divider)" }}
              >
                <td className="px-3 py-2.5 text-center text-xs text-text-secondary align-middle">
                  {route.id}
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-text-primary align-middle">
                  {route.created_at}
                </td>
                <td className="px-3 py-2.5 align-middle text-center">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-text-light" />
                    <span className="text-xs text-text-primary">
                      {route.warehouse_name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-text-primary align-middle">
                  {route.delivery_count}
                </td>
                <td className="max-w-45 truncate px-3 py-2.5 text-center text-xs text-text-secondary align-middle">
                  {route.file_name}
                </td>
                <td className="px-3 py-2.5 text-center align-middle">
                  <button
                    onClick={() => onViewRoute(route)}
                    className="inline-flex h-7 items-center justify-center rounded-md bg-primary-500/20 px-3 text-xs font-medium text-primary-400 transition-colors duration-200 hover:bg-primary-500/30 hover:text-primary-300 cursor-pointer"
                  >
                    Ir a la entrega
                  </button>
                  <button
                    onClick={() => onDeleteRoute(route)}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60 ml-2"
                    style={{
                      borderColor: "rgba(239,68,68,0.35)",
                      color: "var(--color-error)",
                    }}
                  >
                    <Power size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <p className="text-sm">No se encontraron entregas</p>
          </div>
        )}
      </div>

      {data.length > 0 ? (
        <div className="border-t px-3 py-2" style={{ borderColor: "var(--color-divider)" }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              Mostrando {Math.min((currentPage - 1) * safePageSize + 1, data.length)}-{Math.min(currentPage * safePageSize, data.length)} de {data.length}
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
                <ChevronLeft size={12} />
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
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
