"use client";

import { ContentShell } from "@/components/layout/ContentShell";
import { useAlert } from "@/components/layout/AlertProvider";
import { EditWarehouseModal } from "@/components/warehouses/editwarehousemodal";
import { FiltersBar } from "@/components/warehouses/filtersbar";
import { StatsCard } from "@/components/warehouses/statscard";
import type { WarehouseData } from "@/components/warehouses/warehousetable";
import { WarehouseTable } from "@/components/warehouses/warehousetable";

import {
  getWarehousesRequest,
  toggleWarehouseRequest,
} from "@/lib/warehouses-api";

import type { Warehouse } from "@/types/warehouses-types";
import { MapPin, Warehouse as WarehouseIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function CompanyWarehousesPage() {
  const router = useRouter();
  const { addAlert } = useAlert();

  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<WarehouseData | null>(null);

  const isTogglingRef = useRef(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await getWarehousesRequest();
      setWarehouses(data);
    } catch (err: any) {
      addAlert("error", err?.message || "Error al cargar almacenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const sortedWarehouses = useMemo(() => {
    return [...warehouses].sort((a, b) => a.id - b.id);
  }, [warehouses]);

  const filteredWarehouses = useMemo(() => {
    return sortedWarehouses.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        w.city.toLowerCase().includes(searchValue.toLowerCase()) ||
        w.address.toLowerCase().includes(searchValue.toLowerCase());

      if (isTogglingRef.current) return matchesSearch;

      const matchesFilter =
        filterValue === "all" ||
        (filterValue === "active" && w.active) ||
        (filterValue === "inactive" && !w.active);

      return matchesSearch && matchesFilter;
    });
  }, [searchValue, filterValue, sortedWarehouses]);

  const handleToggleStatus = async (warehouse: WarehouseData) => {
    try {
      isTogglingRef.current = true;
      const updated = await toggleWarehouseRequest(warehouse.id);

      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === warehouse.id
            ? { ...w, active: updated.active }
            : w
        )
      );

      addAlert(
        "success",
        `Almacén "${warehouse.name}" ${updated.active ? "activado" : "desactivado"} correctamente`
      );
    } catch (err: any) {
      addAlert("error", err?.message || "Error al cambiar estado");
    } finally {
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 300);
    }
  };
  
  const handleEdit = (warehouse: WarehouseData) => {
    setEditing(warehouse);
  };

  return (
    <ContentShell
      role="company"
      title="Almacenes"
      breadcrumbs={["Empresa", "Almacenes"]}
    >
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading && (
          <div className="flex items-center gap-2 mb-4 text-text-muted text-sm">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            Cargando almacenes...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatsCard
            icon={WarehouseIcon}
            value={warehouses.length}
            label="Almacenes totales"
            iconColor="orange"
          />
          <StatsCard
            icon={MapPin}
            value={warehouses.filter((w) => w.active).length}
            label="Activos"
            iconColor="green"
          />
        </div>

        <div className="mb-4">
          <FiltersBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filterValue={filterValue}
            onFilterChange={setFilterValue}
            onNewWarehouse={() => router.push("/company/new-warehouses")}
          />
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <WarehouseTable
            warehouses={filteredWarehouses}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      <EditWarehouseModal
        warehouse={editing}
        onClose={() => setEditing(null)}
        onSaved={fetchWarehouses}
      />
    </ContentShell>
  );
}