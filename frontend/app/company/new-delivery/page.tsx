"use client";

import { ContentShell } from "@/components/layout/ContentShell";
import { NewRouteForm } from "@/components/deliveries/new-route-form";

export default function CreateRoutePage() {
  return (
    <ContentShell
      role="company"
      title="Nueva Entrega"
      breadcrumbs={["Empresa", "Entrega"]}
    >
        <div className="flex-1 overflow-y-auto">
          <NewRouteForm />
        </div>
    </ContentShell>
  );
}
