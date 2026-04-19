import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL, requestJson } from "@/lib/http";
import { RegisterFormErrors, registerSchema } from "@/schemas/register-schema";

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

type RegistrationFormProps = {
  token: string | undefined;
};

export function RegistrationForm({ token }: Readonly<RegistrationFormProps>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<CompleteRegistrationFormData>({
    name: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    rfc: "",
  });

  useEffect(() => {
    // El botón se controla automáticamente por el estado `loading`
    // No necesitamos un listener global para deshabilitarlo
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error general
    setError("");
    // Limpiar error del campo específico
    if (errors[name as keyof CompleteRegistrationFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const result = registerSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: RegisterFormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validate()) {
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
    } catch (err: any) {
      let errorMessage = "Error al completar el registro. Por favor intenta de nuevo.";
      
      if (typeof err === 'string' && err === 'Conflict') {
        errorMessage = "El usuario ya está registrado con este correo electrónico.";
      } else if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
        <div className="w-full max-w-md rounded-2xl border border-divider bg-surface p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-950/40 p-4">
            <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-400">
              Token inválido o expirado. Por favor solicita un nuevo enlace de
              invitación.
            </p>
          </div>

          <Link href="/login" className="text-sm text-primary hover:underline">
            Volver al login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Completa tu registro</h1>
          <p className="mt-2 text-primary">
            Ingresa tus datos personales y de la empresa para acceder
          </p>
        </div>

        <div className="rounded-2xl border border-divider bg-surface shadow-lg">
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
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-strong text-xs font-bold text-primary">
                    1
                  </span>{" "}
                  Datos Personales
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary">
                      Nombre Completo{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Juan Pérez"
                      className={`mt-2 w-full rounded-lg border bg-surface px-4 py-3 text-sm text-primary placeholder-text-muted outline-none transition focus:ring-1 ${
                        errors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-divider focus:border-primary-500 focus:ring-primary-500/30"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-secondary">
                      Contraseña{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 8 caracteres"
                        className={`w-full rounded-lg border bg-surface px-4 py-3 pr-10 text-sm text-primary placeholder:text-muted outline-none transition focus:ring-1 ${
                          errors.password
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                            : "border-divider focus:border-primary-500 focus:ring-primary-500/30"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                    )}
                    {!errors.password && form.password && form.password.length >= 8 && (
                      <p className="mt-1 text-xs text-green-500">✓ Contraseña válida</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary">
                      Confirmar Contraseña{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repite tu contraseña"
                        className={`w-full rounded-lg border bg-surface px-4 py-3 pr-10 text-sm text-primary placeholder:text-muted outline-none transition focus:ring-1 ${
                          errors.confirmPassword
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                            : "border-divider focus:border-primary-500 focus:ring-primary-500/30"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                    {!errors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword && (
                      <p className="mt-1 text-xs text-green-500">✓ Contraseñas coinciden</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-divider" />

              {/* Datos de la Empresa Section */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-strong text-xs font-bold text-background">
                    2
                  </span>{" "}
                  Datos de la Empresa
                </h2>

                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-secondary">
                      Nombre de la Empresa{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleInputChange}
                      placeholder="Ej: Transportes ABC S.A."
                      className={`mt-2 w-full rounded-lg border bg-surface px-4 py-3 text-sm text-primary placeholder-text-muted outline-none transition focus:ring-1 ${
                        errors.companyName
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-divider focus:border-primary-500 focus:ring-primary-500/30"
                      }`}
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>
                    )}
                  </div>

                  {/* RFC */}
                  <div>
                    <label htmlFor="rfc" className="block text-sm font-medium text-secondary">
                      RFC{" "}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      id="rfc"
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
                        if (errors.rfc) {
                          setErrors((prev) => ({
                            ...prev,
                            rfc: undefined,
                          }));
                        }
                      }}
                      placeholder="ABC123456XYZ"
                      maxLength={13}
                      className={`mt-2 w-full rounded-lg border bg-surface px-4 py-3 font-mono text-sm text-primary placeholder-text-muted uppercase outline-none transition focus:ring-1 ${
                        errors.rfc
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                          : "border-divider focus:border-primary-500 focus:ring-primary-500/30"
                      }`}
                    />
                    {errors.rfc && (
                      <p className="mt-1 text-xs text-red-500">{errors.rfc}</p>
                    )}
                    {!errors.rfc && form.rfc && /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(form.rfc) && (
                      <p className="mt-1 text-xs text-green-500">✓ RFC válido</p>
                    )}
                    {!errors.rfc && form.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(form.rfc) && (
                      <p className="mt-1 text-xs text-text-muted">
                        Formato: 3-4 letras, 6 dígitos, 3 caracteres (ej: ABC123456XYZ)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 cursor-pointer rounded-lg bg-primary-strong px-6 py-3 text-center font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Completando registro..." : "Completar Registro"}
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center rounded-lg border border-divider px-6 py-3 font-medium text-primary transition hover:bg-surface"
              >
                Cancelar
              </Link>
            </div>

            {/* Help Text */}
            <p className="mt-4 text-center text-xs text-muted">
              Por favor completa todos los campos correctamente para activar tu
              cuenta.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}