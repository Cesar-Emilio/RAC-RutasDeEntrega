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
    <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#2a2f38] bg-[#0f1115] px-3 text-[#e5e7eb] focus-within:border-[#f97316]">
      <Search size={14} className="shrink-0 text-[#9ca3af]" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        size={inputSize}
        className="bg-transparent text-sm text-[#e5e7eb] outline-none placeholder:text-[#6b7280]"
      />
    </label>
  );
}