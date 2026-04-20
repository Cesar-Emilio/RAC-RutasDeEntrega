"use client";

// CAMBIO: se elimina MapPin de los imports — no se usa en este componente
import { useState } from "react";
import { Package, Warehouse, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { RouteDetail } from "@/types/routes-types";

interface RouteMetricsProps {
  readonly route: RouteDetail;
}

interface MetricCardProps {
  readonly icon: React.ElementType;
  readonly value: string | number;
  readonly label: string;
}

function MetricCard({ icon: Icon, value, label }: MetricCardProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-primary-500/30 bg-surface p-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-500/50 bg-surface">
        <Icon className="h-5 w-5 text-primary-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

export function RouteMetrics({ route }: RouteMetricsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // IMPLEMENTAR const stopsCount = route.delivery_points.length;
  let truncatedFileName: string | number;
  const fileName = route.file_name;

  if (fileName) {
    truncatedFileName =
      fileName.length > 12 ? fileName.slice(0, 12) + "..." : fileName;
  } else {
    truncatedFileName = "Error en el archivo"
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-border/30 transition-colors"
      >
        <h3 className="text-sm font-medium text-text-primary">
          Información general de la entrega
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-text-secondary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <MetricCard
              icon={Package}
              value={route.delivery_count}
              label="Paquetes"
            />
            <MetricCard
              icon={Warehouse}
              value={route.warehouse_name}
              label="Inicio"
            />
            <MetricCard
              icon={FileText}
              value={truncatedFileName}
              label="Archivo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
