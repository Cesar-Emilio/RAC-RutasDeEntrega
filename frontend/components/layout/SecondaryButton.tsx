import type { ButtonHTMLAttributes, ReactNode } from "react";

type SecondaryButtonProps = {
  children: ReactNode;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function SecondaryButton({
  children,
  isLoading = false,
  disabled,
  className,
  type = "button",
  ...props
}: SecondaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-divider)] bg-transparent px-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
      {...props}
    >
      {isLoading ? "Cargando..." : children}
    </button>
  );
}