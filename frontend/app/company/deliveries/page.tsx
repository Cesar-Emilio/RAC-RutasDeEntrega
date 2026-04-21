"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { RoutesTable } from "@/components/deliveries/routes-table";
import { useRouter } from "next/navigation";
import { deleteRouteRequest, getDeliveriesRequest } from "@/lib/routes-api";
import { RouteTableItem } from "@/types/routes-types";
import { useAlert } from "@/components/layout/AlertProvider";
import { SearchBar } from "@/components/layout/SearchBar";
import { StatusFilter } from "@/components/layout/StatusFilter";
import { Plus } from "lucide-react";
import { ModalConfirm } from "@/components/layout/ModalConfirm";

export default function CompanyRoutesPage() {
  const router = useRouter();
  const { addAlert } = useAlert();

  const [routes, setRoutes] = useState<RouteTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [reloadRoutes, setReloadRoutes] = useState(0);

  const [routeToDelete, setRouteToDelete] = useState<RouteTableItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getDeliveriesRequest();
      setRoutes(data);
    } catch (err: unknown) {
      addAlert("error", "Error al cargar la tabla de entregas");
      const message =
        err instanceof Error ? err.message : "Error al cargar las entregas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes, reloadRoutes]);

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      searchValue === "" ||
      route.warehouse_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      route.id === Number(searchValue) ||
      route.file_name.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus = statusFilter === "all" || true;

    return matchesSearch && matchesStatus;
  });

  const handleNewRoute = () => {
    router.push("/company/new-delivery")
  };

  const handleViewRoute = (route: RouteTableItem) => {
    router.push(`/company/deliveries/${route.id}`)
  };

  const handleOpenDeleteModal = (route: RouteTableItem) => {
    setRouteToDelete(route);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setRouteToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;

    try {
      setIsDeleting(true);

      await deleteRouteRequest(routeToDelete.id);

      addAlert("success", `Entrega ${routeToDelete.id} eliminada correctamente`);

      setIsDeleteModalOpen(false);
      setRouteToDelete(null);

      setReloadRoutes((prev) => prev + 1);
    } catch (error: unknown) {
      addAlert("error", "Error al eliminar la entrega");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ContentShell
      role="company"
      title="Historial de entregas"
      breadcrumbs={["Empresa", "Entregas"]}
    >
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Buscar un almacén..."
          />
          <div className="flex gap-3 sm:flex-none">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "Todos los estados", value: "all" },
                { label: "Pendiente", value: "pending" },
                { label: "En progreso", value: "in-progress" },
                { label: "Completado", value: "completed" },
              ]}
            />
            <button
              onClick={handleNewRoute}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-primary-500 bg-primary-500 px-4 text-sm font-semibold text-background transition hover:opacity-90 cursor-pointer"
            >
              <Plus size={16} />
              Nueva entrega
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-secondary">
            {error}
          </div>
        ) : null}

        <div className="mb-4">
          <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Entregas registradas
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Gestiona el historial de entregas de la empresa
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <RoutesTable data={filteredRoutes} onViewRoute={handleViewRoute} onDeleteRoute={handleOpenDeleteModal} isLoading={loading} />
        </div>
      </div>

      <ModalConfirm
        isOpen={isDeleteModalOpen}
        title="Eliminar entrega"
        message={
          routeToDelete
            ? `¿Deseas eliminar la entrega ${routeToDelete.id}? Esta acción no se puede deshacer.`
            : "¿Deseas eliminar esta entrega? Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteModal}
      />
    </ContentShell>
  );
}
