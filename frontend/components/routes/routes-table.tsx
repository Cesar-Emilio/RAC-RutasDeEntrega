"use client";

import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { RouteTableItem } from "@/types/routes-types";
import { MapPin } from "lucide-react";

interface RoutesTableProps {
  data: RouteTableItem[];
  onViewRoute: (route: RouteTableItem) => void;
  isLoading?: boolean;
}

export function RoutesTable({ data, onViewRoute, isLoading = false }: RoutesTableProps) {
  return (
    <div className="">
      <div className="overflow-x-auto rounded-xl bg-surface border border-border">
        <table className="w-full min-w-160">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-text-light">
                ID
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-light">
                Fecha
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-light">
                Almacen
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-text-light">
                Paquetes
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-text-light">
                Archivo
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-text-light">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <div className="flex min-h-55 flex-col items-center justify-center gap-4 text-secondary">
                    <LoadingSpinner className="h-12 w-12" />
                    <p className="text-sm font-medium">Cargando rutas...</p>
                  </div>
                </td>
              </tr>
            ) : data.map((route, index) => (
              <tr
                key={`${route.id}-${index}`}
                className="border-b border-border last:border-b-0 hover:bg-border/30 transition-colors duration-150"
              >
                <td className="px-4 py-4 text-sm text-text-secondary">
                  {route.id}
                </td>
                <td className="px-4 py-4 text-sm text-text-primary">
                  {route.created_at}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-text-light" />
                    <span className="text-sm text-text-primary">
                      {route.warehouse_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-sm text-text-primary">
                  {route.delivery_count}
                </td>
                <td className="max-w-45 truncate px-4 py-4 text-sm text-text-secondary">
                  {route.file_name}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => onViewRoute(route)}
                    className="
                      inline-flex items-center justify-center px-4 py-1.5 rounded-md
                      bg-primary-500/20 hover:bg-primary-500/30
                      text-primary-400 hover:text-primary-300
                      text-sm font-medium
                      transition-colors duration-200
                    "
                  >
                    Ir a la ruta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <p className="text-sm">No se encontraron rutas</p>
          </div>
        )}
      </div>
    </div>
  );
}
