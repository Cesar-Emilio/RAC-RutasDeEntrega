import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Pencil, Power, Warehouse } from "lucide-react";

export interface WarehouseData {
  id: number;
  name: string;
  city: string;
  state: string;
  postal_code: string;   
  latitude: number;      
  longitude: number
  address: string;
  active: boolean;
}

interface WarehouseTableProps {
  warehouses: WarehouseData[];
  onEdit: (warehouse: WarehouseData) => void;
  onToggleStatus: (warehouse: WarehouseData) => void;
  pageSize?: number;
}

export function WarehouseTable({ warehouses, onEdit, onToggleStatus, pageSize = 5 }: WarehouseTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(warehouses.length / safePageSize));

  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * safePageSize;
    return warehouses.slice(startIndex, startIndex + safePageSize);
  }, [currentPage, warehouses, safePageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [warehouses, safePageSize]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-secondary">Nombre</th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-secondary">Ubicación</th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-secondary">Dirección</th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-secondary">Estado</th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-secondary">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginatedWarehouses.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted">
                No se encontraron almacenes
              </td>
            </tr>
          ) : (
            paginatedWarehouses.map((warehouse) => (
              <tr
                key={warehouse.id}
                className="border-t border-border transition-colors hover:bg-surface"
                style={{ borderColor: "var(--color-divider)" }}
              >
                <td className="px-3 py-2.5 align-middle text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="rounded-md bg-primary-500/20 p-1.5">
                      <Warehouse className="h-3.5 w-3.5 text-primary-500" />
                    </div>
                    <span className="text-xs font-medium text-text-secondary">{warehouse.name}</span>
                  </div>
                </td>

                <td className="px-3 py-2.5 align-middle text-center">
                  <div className="flex items-center justify-center gap-2 text-text-secondary">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-accent-green" />
                    <span className="text-xs">{warehouse.city}, {warehouse.state}</span>
                  </div>
                </td>

                <td className="px-3 py-2.5 text-center text-xs text-text-secondary align-middle">
                  {warehouse.address}
                </td>

                <td className="px-3 py-2.5 align-middle text-center">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    warehouse.active
                      ? "bg-success-bg text-success border-success/30"
                      : "bg-surface-elevated text-text-muted border-border"
                  }`}>
                    {warehouse.active ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td className="px-3 py-2.5 align-middle text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(warehouse)}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border text-(--color-text-primary) transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                      title="Editar almacén"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onToggleStatus(warehouse)}
                      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        warehouse.active
                          ? "text-text-muted hover:text-red-400 hover:bg-red-500/10"
                          : "text-text-muted hover:text-success hover:bg-success/10"
                      }`}
                      title={warehouse.active ? "Desactivar almacén" : "Activar almacén"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>

      {warehouses.length > 0 ? (
        <div className="border-t px-3 py-2" style={{ borderColor: "var(--color-divider)" }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              Mostrando {Math.min((currentPage - 1) * safePageSize + 1, warehouses.length)}-{Math.min(currentPage * safePageSize, warehouses.length)} de {warehouses.length}
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