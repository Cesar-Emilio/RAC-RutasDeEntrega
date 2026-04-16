"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalFrame } from "./ModalFrame";

type ModalEditOption = {
  label: string;
  value: string;
};

export type ModalEditField<T extends { id: string | number }> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  options?: ModalEditOption[];
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
            className="rounded-lg border border-[var(--color-divider)] px-4 py-1 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            form="modal-edit-form"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--color-primary-500)] px-4 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Guardando..." : submitLabel}
          </button>
        </div>
      }
    >
      <form id="modal-edit-form" className="space-y-6" onSubmit={handleSubmit}>
        {fields.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const value = values[field.name];
              const fieldInputType = field.type || "text";

              let fieldInputNode: React.ReactNode;
              if (field.type === "textarea") {
                fieldInputNode = (
                  <textarea
                    value={String(value ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    className="min-h-28 rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-500)]"
                  />
                );
              } else if (field.type === "select") {
                fieldInputNode = (
                  <select
                    value={String(value ?? "")}
                    required={field.required}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    className="rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-500)]"
                  >
                    <option value="">Selecciona una opcion</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );
              } else if (field.type === "checkbox") {
                fieldInputNode = (
                  <label className="inline-flex items-center gap-3 rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => handleChange(field.name, event.target.checked)}
                      className="h-4 w-4 accent-[var(--color-primary-500)]"
                    />
                    <span>{field.helperText || field.label}</span>
                  </label>
                );
              } else {
                fieldInputNode = (
                  <input
                    type={fieldInputType}
                    value={String(value ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    className="rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-500)]"
                  />
                );
              }

              const helperTextNode =
                field.helperText && field.type !== "checkbox" ? (
                  <span className="text-xs text-[var(--color-text-muted)]">{field.helperText}</span>
                ) : null;

              return (
                <label key={field.name} className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)] md:col-span-1">
                  <span className="font-medium">
                    {field.label}
                    {field.required ? <span className="ml-1 text-[var(--color-error)]">*</span> : null}
                  </span>

                  {fieldInputNode}
                  {helperTextNode}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            No hay campos configurados para editar este registro.
          </p>
        )}
      </form>
    </ModalFrame>
  );
}
