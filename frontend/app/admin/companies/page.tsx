"use client";

import { useState, useMemo } from "react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CardStatistics } from "@/components/layout/CardStatistics";
import { SearchBar } from "@/components/layout/SearchBar";
import { StatusFilter } from "@/components/layout/StatusFilter";
import { CrudTable, type CrudColumn } from "@/components/layout/CrudTable";

type Company = {
  id: string;
  nombre: string;
  email: string;
  rfc: string;
  estado: "Activo" | "Inactivo";
};

const companiesData: Company[] = [];

const columns: CrudColumn<Company>[] = [
  {
    key: "nombre",
    label: "Nombre",
    align: "left",
  },
  {
    key: "email",
    label: "Correo Electrónico",
    align: "left",
  },
  {
    key: "rfc",
    label: "RFC",
    align: "left",
  },
  {
    key: "estado",
    label: "Estado",
    render: (company) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          company.estado === "Activo"
            ? "bg-green-900/30 text-green-400"
            : "bg-gray-600/30 text-gray-400"
        }`}
      >
        {company.estado}
      </span>
    ),
  },
];

export default function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companies, setCompanies] = useState<Company[]>(companiesData);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch =
        company.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.rfc.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && company.estado === "Activo") ||
        (statusFilter === "inactive" && company.estado === "Inactivo");

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, companies]);

  const handleToggleStatus = async (company: Company) => {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 500));

    setCompanies(prevCompanies =>
      prevCompanies.map(c =>
        c.id === company.id
          ? { ...c, estado: c.estado === "Activo" ? "Inactivo" : "Activo" }
          : c
      )
    );
  };

  return (
    <ContentShell
      role="admin"
      title="Empresas"
      breadcrumbs={["Admin", "Empresas"]}
    >
      <div className="min-h-screen bg-[#0f1115] p-6">
        {/* Estadísticas */}
        <CardStatistics
          title="Empresas totales"
          description="Administra las empresas del sistema"
          items={[
            { id: 1, label: "Empresas totales", value: companies.length },
            { id: 2, label: "Activas", value: companies.filter(c => c.estado === "Activo").length },
          ]}
        />

        {/* Filtros y Búsqueda */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar una empresa..."
          />
          <div className="flex gap-3">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "Todas las empresas", value: "all" },
                { label: "Activos", value: "active" },
                { label: "Inactivos", value: "inactive" },
              ]}
            />
          </div>
        </div>

        {/* Tabla de Empresas */}
        <CrudTable
          title="Empresas registradas"
          description="Gestiona las empresas del sistema"
          items={filteredCompanies}
          columns={columns}
          statusKey="estado"
          onToggleStatus={handleToggleStatus}
          emptyMessage="No hay empresas que coincidan con los filtros."
        />
      </div>
    </ContentShell>
  );
}
