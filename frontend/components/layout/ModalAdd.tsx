"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { ModalFieldRenderer } from "./ModalFieldRenderer";
import type { ModalField } from "./ModalFieldRenderer";

// Re-export with the original name for backward compatibility
export type ModalAddField<T extends Record<string, unknown>> = ModalField<T>;

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
}: Readonly<ModalAddProps<T>>) {
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary-500)] bg-[var(--color-primary-500)] px-3 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 cursor-pointer"
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
                className="rounded-lg border border-[var(--color-divider)] px-4 py-1 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                form="modal-add-form"
                disabled={isSubmitting}
                className="rounded-lg bg-[var(--color-primary-500)] px-4 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? "Guardando..." : submitLabel}
              </button>
            </div>
          }
        >
          <form id="modal-add-form" className="space-y-6" onSubmit={handleSubmit}>
            <ModalFieldRenderer
              fields={fields as ModalField<Record<string, unknown>>[]}
              values={values}
              onChange={handleChange}
            />
          </form>
        </ModalFrame>
      ) : null}
    </>
  );
}
