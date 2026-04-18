import { ContentShell } from "@/components/layout/ContentShell";

export default function AdminRoutesPage() {
  return (
    <ContentShell
      role="admin"
      title="Entregas"
      breadcrumbs={["Admin", "Entregas"]}
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
        Vista base para gestionar rutas de entrega desde el administrador. Aqui se mostraran
        los historiales y el detalle por entrega.
      </div>
    </ContentShell>
  );
}
