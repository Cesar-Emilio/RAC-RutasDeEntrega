"use client";

import { type ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className = "" }: FormCardProps) {
  return (
    <div
      className={`
        bg-surface rounded-2xl border border-border
        p-6 md:p-8
        ${className}
      `}
    >
      {children}
    </div>
  );
}
