import { ContentShell } from "@/components/layout/ContentShell";

export default function AdminCompaniesPage() {
  return (
    <ContentShell
      role="admin"
      title="Empresas"
      breadcrumbs={["Admin", "Empresas"]}
    >
      <div className="min-h-screen bg-[#0f1115]" />
    </ContentShell>
  );
}
