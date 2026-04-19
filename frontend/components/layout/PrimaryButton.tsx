import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({
  children,
  isLoading = false,
  disabled,
  className,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-primary-500)] bg-[var(--color-primary-500)] px-3 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
      {...props}
    >
      {isLoading ? "Cargando..." : children}
    </button>
  );
}