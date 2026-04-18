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
    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-primary-500/30">
      <div className="w-12 h-12 rounded-lg bg-surface border border-primary-500/50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-text-primary truncate">{value}</p>
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
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-border/30 transition-colors"
      >
        <h3 className="text-sm font-medium text-text-primary">
          Información general de la ruta
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-3">
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
