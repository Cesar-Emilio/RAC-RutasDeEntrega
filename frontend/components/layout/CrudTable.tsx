"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PencilLine, Power } from "lucide-react";
import type { ReactNode } from "react";
import { ModalConfirm } from "./ModalConfirm";
import { ModalEdit } from "./ModalEdit";
import type { ModalEditField } from "./ModalEdit";

export type CrudEditField<T extends { id: string | number }> = ModalEditField<T>;

export type CrudColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  align?: "left" | "center" | "right";
};

type CrudTableProps<T extends { id: string | number }> = {
  title: string;
  description: string;
  items: T[];
  columns: CrudColumn<T>[];
  isLoading?: boolean;
  hideHeader?: boolean;
  emptyMessage?: string;
  statusKey?: keyof T;
  onEdit?: (item: T) => void;
  onEditSubmit?: (updatedItem: T, originalItem: T) => Promise<void> | void;
  onToggleStatus?: (item: T) => void;
  actionLoadingId?: string | number | null;
  editFields?: ModalEditField<T>[];
  editModalTitle?: string;
  editModalDescription?: string;
  editSubmitLabel?: string;
  editCancelLabel?: string;
  pageSize?: number;
};

function getAlignmentClass(align?: CrudColumn<never>["align"]) {
  switch (align) {
    case "right":
      return "text-right";
    case "center":
      return "text-center";
    default:
      return "text-center";
  }
}

export function CrudTable<T extends { id: string | number }>({
  title,
  description,
  items,
  columns,
  isLoading = false,
  hideHeader = false,
  emptyMessage = "Aun no hay registros.",
  statusKey,
  onEdit,
  onEditSubmit,
  onToggleStatus,
  actionLoadingId,
  editFields,
  editModalTitle = "Editar registro",
  editModalDescription = "Actualiza la informacion del registro seleccionado.",
  editSubmitLabel = "Guardar cambios",
  editCancelLabel = "Cancelar",
  pageSize = 5,
}: Readonly<CrudTableProps<T>>) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [statusTargetItem, setStatusTargetItem] = useState<T | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const defaultEditFields = useMemo<ModalEditField<T>[]>(() => {
    if (editFields && editFields.length > 0) {
      return editFields;
    }

    return columns
      .filter((column) => typeof column.key === "string")
      .filter((column) => column.key !== "id")
      .filter((column) => !statusKey || column.key !== statusKey)
      .map((column) => ({
        name: column.key as keyof T & string,
        label: column.label,
        type: "text" as const,
      }));
  }, [columns, editFields, statusKey]);

  const canEdit = Boolean(onEdit || onEditSubmit || defaultEditFields.length > 0);
  const hasActions = Boolean(canEdit || onToggleStatus);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * safePageSize;
    return items.slice(startIndex, startIndex + safePageSize);
  }, [currentPage, items, safePageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items, safePageSize]);

  const openEditModal = (item: T) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingItem(null);
  };

  const openStatusConfirmModal = (item: T) => {
    setStatusTargetItem(item);
    setIsStatusConfirmOpen(true);
  };

  const closeStatusConfirmModal = () => {
    setIsStatusConfirmOpen(false);
    setStatusTargetItem(null);
  };

  const handleConfirmToggleStatus = async () => {
    if (!onToggleStatus || !statusTargetItem) {
      return;
    }

    setIsSubmittingStatus(true);
    try {
      await Promise.resolve(onToggleStatus(statusTargetItem));
      closeStatusConfirmModal();
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleEditSubmit = async (updatedItem: T, originalItem: T) => {
    setIsSavingEdit(true);
    try {
      if (onEditSubmit) {
        await onEditSubmit(updatedItem, originalItem);
      }

      if (onEdit) {
        onEdit(updatedItem);
      }

      closeEditModal();
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getItemIsActive = (item: T) => {
    const itemStatus = statusKey ? item[statusKey] : undefined;
    if (typeof itemStatus === "boolean") {
      return itemStatus;
    }

    return Boolean(itemStatus);
  };

  const getStatusBadgeMeta = (isActive: boolean) => {
    if (isActive) {
      return {
        label: "Activo",
        borderColor: "rgba(34,197,94,0.35)",
        backgroundColor: "rgba(34,197,94,0.12)",
        color: "var(--color-success)",
      };
    }

    return {
      label: "Inactivo",
      borderColor: "rgba(239,68,68,0.35)",
      backgroundColor: "rgba(239,68,68,0.12)",
      color: "var(--color-error)",
    };
  };

  const getStatusActionMeta = (isActive: boolean) => {
    if (isActive) {
      return {
        label: "Desactivar",
        borderColor: "rgba(239,68,68,0.35)",
        color: "var(--color-error)",
      };
    }

    return {
      label: "Activar",
      borderColor: "rgba(34,197,94,0.35)",
      color: "var(--color-success)",
    };
  };

  const renderCellContent = (item: T, column: CrudColumn<T>, isActive: boolean) => {
    const rawValue = item[column.key as keyof T];
    const isStatusColumn = Boolean(statusKey && column.key === statusKey);

    if (isStatusColumn) {
      const statusBadge = getStatusBadgeMeta(isActive);

      return (
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: statusBadge.borderColor,
            backgroundColor: statusBadge.backgroundColor,
            color: statusBadge.color,
          }}
        >
          {statusBadge.label}
        </span>
      );
    }

    if (column.render) {
      return column.render(item);
    }

    return (
      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {String(rawValue ?? "-")}
      </span>
    );
  };

  return (
    <section className="min-w-0">
      {!hideHeader ? (
        <>
          <h2 className="mb-1 text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            {title}
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {isLoading ? "Cargando informacion..." : description}
          </p>
        </>
      ) : null}

      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-200 w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${getAlignmentClass(column.align)}`}
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {column.label}
                  </th>
                ))}
                {hasActions && (
                  <th
                    className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => {
                  const isActive = getItemIsActive(item);
                  const actionDisabled = actionLoadingId === item.id;
                  const statusAction = getStatusActionMeta(isActive);

                  return (
                    <tr
                      key={String(item.id)}
                      className="border-t transition-colors hover:bg-surface"
                      style={{ borderColor: "var(--color-divider)" }}
                    >
                      {columns.map((column) => {
                        const cellContent = renderCellContent(item, column, isActive);

                        return (
                          <td
                            key={String(column.key)}
                            className={`px-3 py-2.5 align-middle ${getAlignmentClass(column.align)}`}
                          >
                            {cellContent}
                          </td>
                        );
                      })}

                      {hasActions && (
                        <td className="px-3 py-2.5 align-middle text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                disabled={actionDisabled}
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border text-(--color-text-primary) transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Editar"
                                title="Editar"
                              >
                                <PencilLine size={13} />
                              </button>
                            )}

                            {onToggleStatus && (
                              <button
                                type="button"
                                onClick={() => openStatusConfirmModal(item)}
                                disabled={actionDisabled}
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60"
                                style={{
                                  borderColor: statusAction.borderColor,
                                  color: statusAction.color,
                                }}
                                aria-label={statusAction.label}
                                title={statusAction.label}
                              >
                                <Power size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                  >
                    {isLoading ? "Cargando registros..." : emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {items.length > 0 ? (
          <div className="border-t px-3 py-2" style={{ borderColor: "var(--color-divider)" }}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                Mostrando {Math.min((currentPage - 1) * safePageSize + 1, items.length)}-{Math.min(currentPage * safePageSize, items.length)} de {items.length}
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

      <ModalEdit
        isOpen={isEditOpen}
        item={editingItem}
        fields={defaultEditFields}
        title={editModalTitle}
        description={editModalDescription}
        submitLabel={editSubmitLabel}
        cancelLabel={editCancelLabel}
        isSubmitting={isSavingEdit}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
      />

      <ModalConfirm
        isOpen={isStatusConfirmOpen && Boolean(statusTargetItem)}
        title="Confirmar cambio de estado"
        message={
          (() => {
            if (!statusTargetItem) {
              return "";
            }

            const targetStatus = statusKey ? statusTargetItem[statusKey] : undefined;
            const targetIsActive = typeof targetStatus === "boolean" ? targetStatus : Boolean(targetStatus);
            return targetIsActive
              ? "Vas a desactivar este registro. Confirmas la accion?"
              : "Vas a activar este registro. Confirmas la accion?";
          })()
        }
        isSubmitting={isSubmittingStatus}
        onCancel={closeStatusConfirmModal}
        onConfirm={handleConfirmToggleStatus}
      />
    </section>
  );
}