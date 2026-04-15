"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ModalFrame } from "./ModalFrame";

type ModalAddOption = {
  label: string;
  value: string;
};

export type ModalAddField<T extends Record<string, unknown>> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  options?: ModalAddOption[];
  required?: boolean;
  helperText?: string;
};

type ModalAddProps<T extends Record<string, unknown>> = {
  title: string;
  description: string;
  buttonLabel?: string;
  submitLabel?: string;
  cancelLabel?: string;
  fields: ModalAddField<T>[];
  initialValues: Partial<T>;
  emptyValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
};

function createInitialState<T extends Record<string, unknown>>(
  fields: ModalAddField<T>[],
  initialValues: Partial<T>,
  emptyValues?: Partial<T>,
) {
  return fields.reduce<Record<string, unknown>>((accumulator, field) => {
    if (field.type === "checkbox") {
      accumulator[field.name] = Boolean(initialValues[field.name] ?? emptyValues?.[field.name] ?? false);
      return accumulator;
    }

    accumulator[field.name] = initialValues[field.name] ?? emptyValues?.[field.name] ?? "";
    return accumulator;
  }, {});
}

export function ModalAdd<T extends Record<string, unknown>>({
  title,
  description,
  buttonLabel = "Nuevo",
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  fields,
  initialValues,
  emptyValues,
  onSubmit,
}: ModalAddProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>(
    () => createInitialState(fields, initialValues, emptyValues),
  );

  const defaultState = useMemo(
    () => createInitialState(fields, initialValues, emptyValues),
    [fields, initialValues, emptyValues],
  );

  useEffect(() => {
    if (!isOpen) {
      setValues(defaultState);
    }
  }, [defaultState, isOpen]);

  const handleChange = (name: string, value: unknown) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(values as T);
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary-500)] bg-[var(--color-primary-500)] px-3 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90"
      >
        <Plus size={14} />
        {buttonLabel}
      </button>

      {isOpen ? (
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
                onClick={closeModal}
                className="rounded-lg border border-[var(--color-divider)] px-4 py-1 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                form="modal-add-form"
                disabled={isSubmitting}
                className="rounded-lg bg-[var(--color-primary-500)] px-4 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Guardando..." : submitLabel}
              </button>
            </div>
          }
        >
          <form id="modal-add-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fields.map((field) => {
                const value = values[field.name];

                return (
                  <label key={field.name} className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)] md:col-span-1">
                    <span className="font-medium">
                      {field.label}
                      {field.required ? <span className="ml-1 text-[var(--color-error)]">*</span> : null}
                    </span>

                    {field.type === "textarea" ? (
                      <textarea
                        value={String(value ?? "")}
                        placeholder={field.placeholder}
                        required={field.required}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                        className="min-h-28 rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-500)]"
                      />
                    ) : field.type === "select" ? (
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
                    ) : field.type === "checkbox" ? (
                      <label className="inline-flex items-center gap-3 rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(event) => handleChange(field.name, event.target.checked)}
                          className="h-4 w-4 accent-[var(--color-primary-500)]"
                        />
                        <span>{field.helperText || field.label}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type || "text"}
                        value={String(value ?? "")}
                        placeholder={field.placeholder}
                        required={field.required}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                        className="rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-500)]"
                      />
                    )}

                    {field.helperText && field.type !== "checkbox" ? (
                      <span className="text-xs text-[var(--color-text-muted)]">{field.helperText}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </form>
        </ModalFrame>
      ) : null}
    </>
  );
}
