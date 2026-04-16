"use client";

import { useState, useMemo } from "react";
import { Mail, AlertCircle, Check } from "lucide-react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CardStatistics } from "@/components/layout/CardStatistics";
import { SearchBar } from "@/components/layout/SearchBar";
import { StatusFilter } from "@/components/layout/StatusFilter";
import { CrudTable, type CrudColumn } from "@/components/layout/CrudTable";
import { API_BASE_URL, requestJson } from "@/lib/http";

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
  
  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

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

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess(false);

    if (!inviteEmail.trim()) {
      setInviteError("El correo electrónico es requerido");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError("Correo electrónico inválido");
      return;
    }

    setInviteLoading(true);

    try {
      await requestJson<{ detail: string }>(
        `${API_BASE_URL}/api/companies/invite/`,
        {
          method: "POST",
          body: JSON.stringify({ email: inviteEmail }),
        }
      );

      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccess(false);
      }, 1500);
    } catch (err) {
      const error = err as {
        detail?: string;
        message?: string;
        errors?: { detail?: string };
        [key: string]: unknown;
      };
      setInviteError(
        error?.detail ||
          error?.errors?.detail ||
          error?.message ||
          "Error al enviar la invitación. Por favor intenta de nuevo."
      );
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <ContentShell
      role="admin"
      title="Empresas"
      breadcrumbs={["Admin", "Empresas"]}
    >
      <div className="min-h-screen bg-[var(--color-background)] p-6">
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
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-primary-500)] bg-[var(--color-primary-500)] px-3 py-1 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90"
            >
              <Mail size={16} />
              Registrar Empresa
            </button>
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

        {/* Modal de Invitación */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className="w-full max-w-md rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              {/* Header */}
              <div className="border-b border-[var(--color-divider)] px-6 py-5">
                <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">Registrar Empresa</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Envía un enlace de invitación al correo de la empresa
                </p>
              </div>

              {/* Body */}
              <form onSubmit={handleInviteSubmit} className="space-y-4 px-6 py-5">
                {/* Error Message */}
                {inviteError && (
                  <div className="flex items-start gap-3 rounded-lg bg-red-950/40 p-3">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
                    <p className="text-sm text-red-400">{inviteError}</p>
                  </div>
                )}

                {/* Success Message */}
                {inviteSuccess && (
                  <div className="flex items-start gap-3 rounded-lg bg-green-950/40 p-3">
                    <Check size={18} className="mt-0.5 flex-shrink-0 text-green-500" />
                    <p className="text-sm text-green-400">
                      ¡Invitación enviada correctamente!
                    </p>
                  </div>
                )}

              {/* Email Input */}
                <label className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-medium">
                    Correo Electrónico
                    {' '}
                    <span className="ml-1 text-[var(--color-error)]">*</span>
                  </span>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError("");
                    }}
                    placeholder="empresa@correo.com"
                    disabled={inviteLoading || inviteSuccess}
                    className="rounded-lg border border-[var(--color-divider)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary-500)] disabled:opacity-50"
                  />
                </label>

                {/* Submit Button inside form */}
                <button
                  type="submit"
                  disabled={inviteLoading || inviteSuccess}
                  className="w-full rounded-lg bg-[var(--color-primary-500)] px-4 py-2 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviteLoading ? "Enviando..." : "Enviar Invitación"}
                </button>

                {/* Info Text */}
                <p className="text-xs text-[var(--color-text-muted)]">
                  Se enviará un enlace al correo para que la empresa complete su registro.
                </p>
              </form>

              {/* Footer */}
              <div className="border-t border-[var(--color-divider)] px-6 py-5">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setInviteEmail("");
                      setInviteError("");
                      setInviteSuccess(false);
                    }}
                    disabled={inviteLoading}
                    className="rounded-lg border border-[var(--color-divider)] px-4 py-1 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] disabled:opacity-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ContentShell>
  );
}
