import type { ReactNode } from "react";

export type ModalFieldOption = {
  label: string;
  value: string;
};

export type ModalField<T extends Record<string, unknown>> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  options?: ModalFieldOption[];
  required?: boolean;
  helperText?: string;
};

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

type ModalFieldRendererProps<T extends Record<string, unknown>> = {
  fields: ModalField<T>[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
};

export function ModalFieldRenderer<T extends Record<string, unknown>>({
  fields,
  values,
  onChange,
}: Readonly<ModalFieldRendererProps<T>>) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.name];
        const fieldInputType = field.type || "text";

        let fieldInputNode: ReactNode;
        if (field.type === "textarea") {
          fieldInputNode = (
            <textarea
            value={toInputValue(value)}
              placeholder={field.placeholder}
              required={field.required}
              onChange={(event) => onChange(field.name, event.target.value)}
              className="min-h-28 rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-500)]"
            />
          );
        } else if (field.type === "select") {
          fieldInputNode = (
            <select
              value={toInputValue(value)}
              required={field.required}
              onChange={(event) => onChange(field.name, event.target.value)}
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
                onChange={(event) => onChange(field.name, event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary-500)]"
              />
              <span>{field.helperText || field.label}</span>
            </label>
          );
        } else {
          fieldInputNode = (
            <input
              type={fieldInputType}
              value={toInputValue(value)}
              placeholder={field.placeholder}
              required={field.required}
              onChange={(event) => onChange(field.name, event.target.value)}
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
  );
}
