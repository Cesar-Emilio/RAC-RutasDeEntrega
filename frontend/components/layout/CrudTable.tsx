"use client";

import { useMemo, useState } from "react";
import { PencilLine, Power } from "lucide-react";
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
}: CrudTableProps<T>) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [statusTargetItem, setStatusTargetItem] = useState<T | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

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
      await onToggleStatus(statusTargetItem);
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

  return (
    <section className="min-w-0">
      <h2 className="mb-1 text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </h2>
      <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {isLoading ? "Cargando informacion..." : description}
      </p>

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
                {hasActions ? (
                  <th
                    className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Acciones
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => {
                  const itemStatus = statusKey ? item[statusKey] : undefined;
                  const isActive = typeof itemStatus === "boolean" ? itemStatus : Boolean(itemStatus);
                  const actionDisabled = actionLoadingId === item.id;

                  return (
                    <tr
                      key={String(item.id)}
                      className="border-t transition-colors hover:bg-[var(--color-surface)]"
                      style={{ borderColor: "var(--color-divider)" }}
                    >
                      {columns.map((column) => {
                        const rawValue = item[column.key as keyof T];
                        const isStatusColumn = statusKey && column.key === statusKey;

                        return (
                          <td
                            key={String(column.key)}
                            className={`px-3 py-2.5 align-middle ${getAlignmentClass(column.align)}`}
                          >
                            {isStatusColumn ? (
                              <span
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                                style={{
                                  borderColor: isActive ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
                                  backgroundColor: isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                  color: isActive ? "var(--color-success)" : "var(--color-error)",
                                }}
                              >
                                {isActive ? "Activo" : "Inactivo"}
                              </span>
                            ) : column.render ? (
                              column.render(item)
                            ) : (
                              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                {String(rawValue ?? "-")}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {hasActions ? (
                        <td className="px-3 py-2.5 align-middle text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                disabled={actionDisabled}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Editar"
                                title="Editar"
                              >
                                <PencilLine size={13} />
                              </button>
                            ) : null}

                            {onToggleStatus ? (
                              <button
                                type="button"
                                onClick={() => openStatusConfirmModal(item)}
                                disabled={actionDisabled}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60"
                                style={{
                                  borderColor: isActive ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)",
                                  color: isActive ? "var(--color-error)" : "var(--color-success)",
                                }}
                                aria-label={isActive ? "Desactivar" : "Activar"}
                                title={isActive ? "Desactivar" : "Activar"}
                              >
                                <Power size={13} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]"
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                  >
                    {isLoading ? "Cargando registros..." : emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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