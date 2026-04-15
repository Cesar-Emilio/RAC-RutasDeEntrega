"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minChars?: number;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  minChars = 18,
}: SearchBarProps) {
  const inputSize = Math.max(minChars, placeholder.length);

  return (
    <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-3 text-[var(--color-text-primary)] focus-within:border-[var(--color-primary-500)]">
      <Search size={14} className="shrink-0 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        size={inputSize}
        className="bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
      />
    </label>
  );
}