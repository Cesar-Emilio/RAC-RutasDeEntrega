"use client";

import { ChevronDown } from "lucide-react";

export type StatusFilterOption = {
  label: string;
  value: string;
};

type StatusFilterProps = {
  value: string;
  onChange: (value: string) => void;
  options?: StatusFilterOption[];
};

const defaultOptions: StatusFilterOption[] = [
  { label: "Todos los estados", value: "all" },
  { label: "Activos", value: "active" },
  { label: "Inactivos", value: "inactive" },
];

export function StatusFilter({
  value,
  onChange,
  options = defaultOptions,
}: Readonly<StatusFilterProps>) {
  return (
    <label className="relative inline-flex h-8 items-center">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 appearance-none rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] py-1 pl-3 pr-9 text-sm text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary-500)]"
        style={{ color: "var(--color-text-muted)" }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-background)" }}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 text-[var(--color-text-muted)]"
      />
    </label>
  );
}