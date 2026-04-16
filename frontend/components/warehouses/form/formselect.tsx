"use client";

import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({
  label,
  error,
  options,
  placeholder = "Seleccionar...",
  className = "",
  ...props
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary">{label}</label>
      <div className="relative">
        <select
          className={`
            w-full px-4 py-3 rounded-xl appearance-none
            bg-surface-elevated border border-border
            text-text-primary
            focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
            transition-colors cursor-pointer
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            ${className}
          `}
          {...props}
        >
          <option value="" className="bg-surface text-text-muted">
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-surface text-text-primary"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
      </div>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
