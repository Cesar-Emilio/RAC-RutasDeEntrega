"use client";

import Link from "next/link";
import { useRoleRedirect } from "@/components/auth/useRoleRedirect";

export default function Home() {
  useRoleRedirect();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background)] text-white">
      <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-[var(--color-border)]/60 blur-3xl" />
      <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[var(--color-primary-500)]/20 blur-3xl" />
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-primary-500)]">
          Smart Route Planner
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
          Controla tus rutas de entrega con velocidad, foco y claridad.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--color-text-muted)]">
          Accede a tableros por rol, gestiona empresas y protege cada operacion
          con autenticacion basada en JWT.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary-500)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5"
          >
            Login
          </Link>
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)]">
            Acceso seguro JWT
          </span>
        </div>
      </main>
    </div>
  );
}
