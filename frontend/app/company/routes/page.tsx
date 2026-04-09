import { DashboardShell } from "@/components/layout/DashboardShell";

export default function CompanyRoutesPage() {
  return (
    <DashboardShell
      role="company"
      title="Rutas"
      breadcrumbs={["Empresa", "Rutas"]}
    >
      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-6 text-sm text-[#9ca3af]">
        Vista base para cargar archivos y calcular rutas. Aqui se integrara el
        flujo de carga y el historial por empresa.
      </div>
    </DashboardShell>
  );
}
