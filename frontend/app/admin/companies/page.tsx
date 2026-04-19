"use client";

import { useState, useEffect, useMemo, type SyntheticEvent } from "react";
import { Mail, AlertCircle, Check } from "lucide-react";
import { ContentShell } from "@/components/layout/ContentShell";
import { CardStatistics } from "@/components/layout/CardStatistics";
import { SearchBar } from "@/components/layout/SearchBar";
import { StatusFilter } from "@/components/layout/StatusFilter";
import { CrudTable, type CrudColumn } from "@/components/layout/CrudTable";
import { useAlert } from "@/components/layout/AlertProvider";
import { API_BASE_URL, requestJson } from "@/lib/http";

type Company = {
  id: string;
  name: string;
  email: string;
  rfc: string;
  active: boolean;
};

const companiesData: Company[] = [];

const columns: CrudColumn<Company>[] = [
  {
    key: "name",
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
    key: "active",
    label: "Estado",
    align: "left",
  },
];

export default function AdminCompaniesPage() {
  const { addAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companies, setCompanies] = useState<Company[]>(companiesData);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [reloadCompanies, setReloadCompanies] = useState(0);
  
  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const loadCompanies = async () => {
    setIsLoading(true);
    setFetchError("");

    try {
      const data = await requestJson<Company[]>(`${API_BASE_URL}/api/companies/`, {
        method: "GET",
      });

      setCompanies(data);
    } catch (error: unknown) {
      console.error("Error fetching companies:", error);
      const msg = "Error al cargar las empresas. Intenta de nuevo más tarde.";
      setFetchError(msg);
      addAlert("error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [reloadCompanies]);

  useEffect(() => {
    const disableSubmitButtons = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form?.matches("form")) {
        return;
      }

      const buttons = Array.from(
        form.querySelectorAll("button[type='submit'], input[type='submit']"),
      ) as Array<HTMLButtonElement | HTMLInputElement>;

      buttons.forEach((button) => {
        if (!button.disabled) {
          button.disabled = true;
        }
      });
    };

    document.addEventListener("submit", disableSubmitButtons, true);
    return () => document.removeEventListener("submit", disableSubmitButtons, true);
  }, []);

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess(false);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      const matchesSearch =
        company.name.toLowerCase().includes(normalizedSearch) ||
        company.email.toLowerCase().includes(normalizedSearch) ||
        company.rfc.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && company.active) ||
        (statusFilter === "inactive" && !company.active);

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, companies]);

  const handleToggleStatus = async (company: Company) => {
    setActionLoadingId(company.id);

    try {
      await requestJson<Company>(
        `${API_BASE_URL}/api/companies/${company.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ active: !company.active }),
        }
      );

      addAlert(
        "success",
        `Empresa "${company.name}" ${company.active ? "desactivada" : "activada"} correctamente`
      );

      setReloadCompanies((prev) => prev + 1);
    } catch (error: unknown) {
      console.error("Error toggling company status:", error);
      addAlert("error", "Error al cambiar el estado de la empresa");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditSubmit = async (updatedCompany: Company, originalCompany: Company) => {
    const payload: Partial<Company> = {
      name: updatedCompany.name,
      rfc: updatedCompany.rfc,
    };

    try {
      const savedCompany = await requestJson<Company>(
        `${API_BASE_URL}/api/companies/${originalCompany.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      const companyName = savedCompany?.name || updatedCompany.name || originalCompany.name;
      addAlert("success", `Empresa "${companyName}" actualizada correctamente`);

      setReloadCompanies((prev) => prev + 1);
    } catch (error: unknown) {
      console.error("Error editing company:", error);
      addAlert("error", "Error al editar la empresa");
      throw error;
    }
  };

  const handleInviteSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inviteLoading) {
      return;
    }

    setInviteError("");
    setInviteSuccess(false);

    if (!inviteEmail.trim()) {
      setInviteError("El correo electrónico es requerido");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
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
      addAlert("success", "Invitación enviada correctamente");
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
      <div className="bg-background p-6">
        {/* Estadísticas */}
        <CardStatistics
          title="Empresas totales"
          description="Administra las empresas del sistema"
          items={[
            { id: 1, label: "Empresas totales", value: companies.length },
            { id: 2, label: "Activas", value: companies.filter((c) => c.active).length },
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
              className="inline-flex items-center gap-2 rounded-lg border border-primary-500 bg-primary-500 px-3 py-1 text-sm font-semibold text-background transition hover:opacity-90 cursor-pointer"
            >
              <Mail size={16} />
              Registrar Empresa
            </button>
          </div>
        </div>

        {/* Tabla de Empresas */}
        {fetchError ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-100">
            {fetchError}
          </div>
        ) : null}
        <CrudTable
          title="Empresas registradas"
          description={isLoading ? "Cargando empresas..." : "Gestiona las empresas del sistema"}
          items={filteredCompanies}
          columns={columns}
          statusKey="active"
          editFields={[
            { name: "name", label: "Nombre", type: "text", required: true },
            { name: "rfc", label: "RFC", type: "text", required: true },
          ]}
          onEditSubmit={handleEditSubmit}
          onToggleStatus={handleToggleStatus}
          actionLoadingId={actionLoadingId}
          isLoading={isLoading}
          emptyMessage="No hay empresas que coincidan con los filtros."
        />

        {/* Modal de Invitación */}
        {isInviteModalOpen && (
          <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInviteModal();
            }
          }}
        >
            <div className="w-full max-w-md rounded-2xl border border-divider bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              {/* Header */}
              <div className="border-b border-divider px-6 py-5">
                <h2 className="text-lg font-semibold text-(--color-text-secondary)">Registrar Empresa</h2>
                <p className="mt-1 text-sm text-(--color-text-muted)">
                  Envía un enlace de invitación al correo de la empresa
                </p>
              </div>

              {/* Body */}
              <form onSubmit={handleInviteSubmit} className="space-y-4 px-6 py-5">
                {/* Error Message */}
                {inviteError && (
                    <div className="flex items-start gap-3 rounded-lg bg-red-950/40 p-3">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                    <p className="text-sm text-red-400">{inviteError}</p>
                  </div>
                )}

                {/* Success Message */}
                {inviteSuccess && (
                    <div className="flex items-start gap-3 rounded-lg bg-green-950/40 p-3">
                    <Check size={18} className="mt-0.5 shrink-0 text-green-500" />
                    <p className="text-sm text-green-400">
                      ¡Invitación enviada correctamente!
                    </p>
                  </div>
                )}

              {/* Email Input */}
                <label className="flex flex-col gap-2 text-sm text-(--color-text-secondary)">
                  <span className="font-medium">
                    Correo Electrónico
                    {' '}
                    <span className="ml-1 text-error">*</span>
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
                    className="rounded-lg border border-divider bg-background px-4 py-3 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) outline-none transition focus:border-primary-500 disabled:opacity-50"
                  />
                </label>

                {/* Submit Button inside form */}
                <button
                  type="submit"
                  disabled={inviteLoading || inviteSuccess}
                  className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {inviteLoading ? "Enviando..." : "Enviar Invitación"}
                </button>

                {/* Info Text */}
                <p className="text-xs text-(--color-text-muted)">
                  Se enviará un enlace al correo para que la empresa complete su registro.
                </p>
              </form>

              {/* Footer */}
              <div className="border-t border-divider px-6 py-5">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    disabled={inviteLoading}
                    className="rounded-lg border border-divider px-4 py-1 text-sm font-medium text-(--color-text-primary) transition hover:bg-surface disabled:opacity-50 cursor-pointer"
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
