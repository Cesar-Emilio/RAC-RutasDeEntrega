import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      role="admin"
      title="Dashboard general"
      breadcrumbs={["Admin", "Dashboard"]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f97316]">
            Empresas activas
          </h2>
          <p className="mt-3 text-3xl font-semibold text-white">--</p>
          <p className="mt-2 text-xs text-[#9ca3af]">
            Pendiente de integracion con el modulo de empresas.
          </p>
        </section>
        <section className="rounded-2xl border border-[#1f2937] bg-[#111827] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f97316]">
            Rutas del dia
          </h2>
          <p className="mt-3 text-3xl font-semibold text-white">--</p>
          <p className="mt-2 text-xs text-[#9ca3af]">
            Pendiente de integracion con el modulo de rutas.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
