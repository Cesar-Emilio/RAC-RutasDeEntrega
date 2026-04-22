"use client";

import type { ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

type ContentShellProps = {
  role: "admin" | "company";
  title: string;
  breadcrumbs: string[];
  children?: ReactNode;
  isLoading?: boolean;
  loadingTitle?: string;
  loadingMessage?: string;
  onRetry?: () => void;
};


export function ContentShell({
  role,
  title,
  breadcrumbs,
  children,
  isLoading = false,
  loadingTitle = "Cargando contenido...",
  loadingMessage = "Espera un momento mientras terminamos de cargar la informacion.",
  onRetry,
}: Readonly<ContentShellProps>) {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex min-h-screen w-full">
        <Sidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar title={title} breadcrumbs={breadcrumbs} />
          <main className="flex-1 px-6 py-6 sm:px-8 sm:py-8">
            {isLoading ? (
              <div className="flex min-h-[calc(100vh-11rem)] items-center justify-center rounded-2xl border border-border bg-surface px-6 py-10">
                <div className="flex flex-col items-center gap-4 text-center">
                  <LoadingSpinner className="h-14 w-14" />
                  <div className="space-y-1">
                    <p className="text-lg font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      {loadingTitle}
                    </p>
                    <p className="max-w-md text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {loadingMessage}
                    </p>
                  </div>
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-primary-500/50 hover:text-primary-400"
                    >
                      Reintentar
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
