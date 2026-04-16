"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL, requestJson } from "@/lib/http";

interface CompleteRegistrationFormData {
  name: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  rfc: string;
}

interface ApiErrorResponse {
  detail?: string;
  [key: string]: unknown;
}

export default function CompleteRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<CompleteRegistrationFormData>({
    name: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    rfc: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateRFC = (rfc: string): boolean => {
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    return rfcRegex.test(rfc.toUpperCase());
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError("El nombre es requerido");
      return false;
    }

    if (!form.password) {
      setError("La contraseña es requerida");
      return false;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    if (!form.companyName.trim()) {
      setError("El nombre de la empresa es requerido");
      return false;
    }

    if (!form.rfc.trim()) {
      setError("El RFC es requerido");
      return false;
    }

    if (!validateRFC(form.rfc)) {
      setError(
        "RFC inválido. Formato: ABC123456XYZ (3-4 letras, 6 dígitos, 3 caracteres)"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        password: form.password,
        role: "company",
        company_name: form.companyName,
        rfc: form.rfc.toUpperCase(),
      };

      await requestJson<{
        detail: string;
        user?: { id: number; email: string; name: string };
      }>(`${API_BASE_URL}/api/register/${token}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccessMessage(
        "¡Registro completado exitosamente! Redirigiendo al login..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const errorData = (err as ApiErrorResponse) || {};
      const errorMessage =
        errorData.detail ||
        "Error al completar el registro. Por favor intenta de nuevo.";
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-strong)] p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-950/40 p-4">
            <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-400">
              Token inválido o expirado. Por favor solicita un nuevo enlace de
              invitación.
            </p>
          </div>

          <Link href="/login" className="text-sm text-[var(--accent)] hover:underline">
            Volver al login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-6 sm:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Completa tu registro</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">
            Ingresa tus datos personales y de la empresa para acceder
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-strong)] shadow-lg">
          {/* Error Message */}
          {error && (
            <div className="border-l-4 border-red-500 bg-red-950/40 px-6 py-4 text-red-400">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="border-l-4 border-green-500 bg-green-950/40 px-6 py-4 text-green-400">
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Datos del Usuario Section */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--foreground-muted)]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--background)]">
                    1
                  </span>{" "}
                  Datos Personales
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground-muted)]">
                      Nombre Completo{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Juan Pérez"
                      className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground-muted)]">
                      Contraseña{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 pr-10 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {form.password && form.password.length < 8 && (
                      <p className="mt-1 text-xs text-yellow-500">
                        Mínimo 8 caracteres
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground-muted)]">
                      Confirmar Contraseña{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="relative mt-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repite tu contraseña"
                        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 pr-10 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {form.confirmPassword &&
                      form.password !== form.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">
                          Las contraseñas no coinciden
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--border-soft)]" />

              {/* Datos de la Empresa Section */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--foreground-muted)]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--background)]">
                    2
                  </span>{" "}
                  Datos de la Empresa
                </h2>

                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-[var(--foreground-muted)]">
                      Nombre de la Empresa{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleInputChange}
                      placeholder="Ej: Transportes ABC S.A."
                      className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                    />
                  </div>

                  {/* RFC */}
                  <div>
                    <label htmlFor="rfc" className="block text-sm font-medium text-[var(--foreground-muted)]">
                      RFC{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="rfc"
                      value={form.rfc}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setForm((prev) => ({
                          ...prev,
                          rfc: value,
                        }));
                        setError("");
                      }}
                      placeholder="ABC123456XYZ"
                      maxLength={13}
                      className="mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] uppercase outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                    />
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                      Formato: 3-4 letras, 6 dígitos, 3 caracteres (ej:
                      ABC123456XYZ)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[var(--accent)] px-6 py-3 text-center font-semibold text-[var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Completando registro..." : "Completar Registro"}
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center rounded-lg border border-[var(--border-soft)] px-6 py-3 font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Cancelar
              </Link>
            </div>

            {/* Help Text */}
            <p className="mt-4 text-center text-xs text-[var(--foreground-subtle)]">
              Por favor completa todos los campos correctamente para activar tu
              cuenta.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
