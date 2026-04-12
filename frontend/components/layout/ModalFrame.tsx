"use client";

import type { ReactNode } from "react";

type ModalFrameProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  maxWidthClass?: "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
  bodyClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function ModalFrame({
  isOpen,
  title,
  description,
  maxWidthClass = "max-w-2xl",
  bodyClassName,
  children,
  footer,
}: ModalFrameProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div
        className={`w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-[#2a2f38] bg-[#161A20] shadow-[0_24px_60px_rgba(0,0,0,0.45)]`}
      >
        <div className="border-b border-[#252a33] px-6 py-5">
          <h2 className="text-lg font-semibold text-[#BBBDC0]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[#6b7280]">{description}</p> : null}
        </div>

        <div className={bodyClassName}>{children}</div>

        {footer ? <div className="border-t border-[#252a33] px-6 py-5">{footer}</div> : null}
      </div>
    </div>
  );
}
