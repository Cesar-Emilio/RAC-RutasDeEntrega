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
      className={`inline-flex h-8 items-center justify-center rounded-lg border border-[#2a2f38] bg-transparent px-3 text-sm font-medium text-[#e5e7eb] transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
      {...props}
    >
      {isLoading ? "Cargando..." : children}
    </button>
  );
}