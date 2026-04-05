import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminRoutesPage() {
  return (
    <DashboardShell
      role="admin"
      title="Rutas"
      breadcrumbs={["Admin", "Rutas"]}
    >
      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-6 text-sm text-[#9ca3af]">
        Vista base para gestionar rutas desde el administrador. Aqui se mostraran
        los historiales y el detalle por ruta.
      </div>
    </DashboardShell>
  );
}
