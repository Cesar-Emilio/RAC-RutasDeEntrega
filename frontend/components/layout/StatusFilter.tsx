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
}: StatusFilterProps) {
  return (
    <label className="relative inline-flex h-8 items-center">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 appearance-none rounded-lg border border-[#2a2f38] bg-[#0f1115] py-1 pl-3 pr-9 text-sm text-[#6b7280] outline-none transition focus:border-[#f97316]"
        style={{ color: "#6b7280" }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{ color: "#6b7280", backgroundColor: "#0f1115" }}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 text-[#9ca3af]"
      />
    </label>
  );
}