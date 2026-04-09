import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminCompaniesPage() {
  return (
    <DashboardShell
      role="admin"
      title="Empresas"
      breadcrumbs={["Admin", "Empresas"]}
    >
      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-6 text-sm text-[#9ca3af]">
        Vista base para el CRUD de empresas. Aqui se integrara la tabla y el
        flujo de creacion cuando el modulo este listo.
      </div>
    </DashboardShell>
  );
}
