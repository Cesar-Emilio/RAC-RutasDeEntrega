import { ContentShell } from "@/components/layout/ContentShell";

export default function AdminRoutesPage() {
  return (
    <ContentShell
      role="admin"
      title="Rutas"
      breadcrumbs={["Admin", "Rutas"]}
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
        Vista base para gestionar rutas desde el administrador. Aqui se mostraran
        los historiales y el detalle por ruta.
      </div>
    </ContentShell>
  );
}
