"use client";

import { ContentShell } from "@/components/layout/ContentShell";
import { useRouter } from "next/navigation";
import { NewRouteForm } from "@/components/routes/new-route-form";

export default function CreateRoutePage() {
  const router = useRouter();

  return (
    <ContentShell
      role="company"
      title="Historial de rutas"
      breadcrumbs={["Empresa", "Rutas"]}
    >
        <div className="flex-1 overflow-y-auto">
          <NewRouteForm />
        </div>
    </ContentShell>
  );
}
