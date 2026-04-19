"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalFrame } from "./ModalFrame";
import { ModalFieldRenderer } from "./ModalFieldRenderer";
import type { ModalField, ModalFieldOption } from "./ModalFieldRenderer";

// Re-export with the original name for backward compatibility
export type ModalEditField<T extends { id: string | number }> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  options?: ModalFieldOption[];
  required?: boolean;
  helperText?: string;
};

type ModalEditProps<T extends { id: string | number }> = {
  isOpen: boolean;
  item: T | null;
  fields: ModalEditField<T>[];
  title: string;
  description: string;
  submitLabel: string;
  cancelLabel: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (updatedItem: T, originalItem: T) => Promise<void> | void;
};

export function ModalEdit<T extends { id: string | number }>({
  isOpen,
  item,
  fields,
  title,
  description,
  submitLabel,
  cancelLabel,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Readonly<ModalEditProps<T>>) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const initialValues = useMemo(() => {
    if (!item) {
      return {};
    }

    return fields.reduce<Record<string, unknown>>((accumulator, field) => {
      const rawValue = item[field.name];

      if (field.type === "checkbox") {
        accumulator[field.name] = Boolean(rawValue);
      } else {
        accumulator[field.name] = rawValue ?? "";
      }

      return accumulator;
    }, {});
  }, [fields, item]);

  useEffect(() => {
    if (!isOpen) {
      setValues({});
      return;
    }

    setValues(initialValues);
  }, [initialValues, isOpen]);

  if (!isOpen || !item) {
    return null;
  }

  const handleChange = (name: string, value: unknown) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const updatedItem = {
      ...item,
      ...(values as Partial<T>),
    } as T;

    await onSubmit(updatedItem, item);
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      title={title}
      description={description}
      maxWidthClass="max-w-2xl"
      bodyClassName="max-h-[calc(90vh-180px)] overflow-y-auto px-6 py-5"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-divider)] px-4 py-1 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            form="modal-edit-form"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--color-primary-500)] px-4 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? "Guardando..." : submitLabel}
          </button>
        </div>
      }
    >
      <form id="modal-edit-form" className="space-y-6" onSubmit={handleSubmit}>
        {fields.length > 0 ? (
          <ModalFieldRenderer
            fields={fields as unknown as ModalField<Record<string, unknown>>[]}
            values={values}
            onChange={handleChange}
          />
        ) : (
          <p className="rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            No hay campos configurados para editar este registro.
          </p>
        )}
      </form>
    </ModalFrame>
  );
}
