import { ContentShell } from "@/components/layout/ContentShell";

export default function CompanyWarehousesPage() {
  return (
    <ContentShell
      role="company"
      title="Almacenes"
      breadcrumbs={["Empresa", "Almacenes"]}
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
        Vista base para el CRUD de almacenes. Aqui se integrara la tabla con los
        almacenes activos y el formulario de alta.
      </div>
    </ContentShell>
  );
}
