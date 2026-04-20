import { Warehouse } from "@/types/warehouses-types";
import { useState } from "react";
import { SectionHeader } from "./section-header";
import { ChevronDown, Loader2 } from "lucide-react";

interface WarehouseSelectProps {
  warehouses: Warehouse[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  onSelect: (warehouse: Warehouse) => void;
}

export const WarehouseSelect = ({
  warehouses,
  selectedId,
  loading,
  error,
  onSelect,
}: WarehouseSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.id === selectedId
  );

  return (
    <div className="mb-6">
      <SectionHeader
        step={1}
        title="Almacén de partida"
        description="Selecciona el almacén desde donde saldrán los paquetes"
      />

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading || !!error}
          className="
            w-full flex items-center justify-between
            px-4 py-2 rounded-lg
            bg-surface border border-border
            text-left
            hover:border-divisor
            transition-colors
            disabled:cursor-not-allowed disabled:opacity-70
            cursor-pointer
          "
        >
          {loading ? (
            <span className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando almacenes...
            </span>
          ) : (
            <span
              className={
                selectedWarehouse
                  ? "text-text-primary"
                  : "text-text-secondary"
              }
            >
              {selectedWarehouse?.name ?? "Seleccionar almacén..."}
            </span>
          )}

          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {error && (
          <p className="mt-2 text-xs text-error">{error}</p>
        )}

        {isOpen && !loading && (
          <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-surface py-1 shadow-lg">
            {warehouses.map((warehouse) => (
              <button
                key={warehouse.id}
                type="button"
                onClick={() => {
                  onSelect(warehouse);
                  setIsOpen(false);
                }}
                className="
                  w-full px-4 py-1.5 text-left text-sm
                  hover:bg-border/50
                  transition-colors
                  cursor-pointer
                "
              >
                {warehouse.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}