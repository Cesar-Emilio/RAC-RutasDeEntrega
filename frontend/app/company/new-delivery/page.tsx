"use client";

import { ArrowLeft } from "lucide-react";
import { ContentShell } from "@/components/layout/ContentShell";
import { NewRouteForm } from "@/components/deliveries/new-route-form";
import { useRouter } from "next/navigation";

export default function CreateRoutePage() {
  const router = useRouter();

  return (
    <ContentShell
      role="company"
      title="Nueva Entrega"
      breadcrumbs={["Empresa", "Entrega"]}
    >
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                Nueva entrega
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Sube un archivo y calcula la ruta de entrega más eficiente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition hover:border-primary-500/50 hover:text-primary-400"
              aria-label="Volver al historial de entregas"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          <NewRouteForm />
        </div>
    </ContentShell>
  );
}
