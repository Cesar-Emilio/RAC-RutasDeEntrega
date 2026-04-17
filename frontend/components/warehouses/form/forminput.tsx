"use client";

import { type InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

export function FormInput({
  label,
  error,
  optional,
  disabled,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-secondary">
        {label}
        {optional && <span className="text-text-muted ml-1">(opcional)</span>}
      </label>
      <input
        className={`
          w-full px-4 py-3 rounded-xl
          bg-surface-elevated border border-border
          text-text-primary placeholder:text-text-muted
          focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
          transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed bg-surface" : ""}
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          ${className}
        `}
        disabled={disabled}
        {...props}
      />
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
