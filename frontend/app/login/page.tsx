"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRoleRedirect } from "@/components/auth/useRoleRedirect";
import { API_BASE_URL } from "@/lib/http";

type FormState = {
  email: string;
  password: string;
  remember: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  useRoleRedirect();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(form.email.trim(), form.password, form.remember);
      router.push("/");
    } catch (err) {
      const maybeError = err as {
        errors?: { detail?: string | string[] };
        message?: string;
      };
      const detail = maybeError?.errors?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        setError(String(detail[0]));
      } else if (typeof detail === "string" && detail.trim().length > 0) {
        setError(detail);
      } else {
        setError(maybeError?.message || "Invalid credentials or inactive account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleLogin = () => {
    globalThis.location.href = `${API_BASE_URL}/api/auth/google/login/`;
  };

  return (
    <div className="min-h-screen bg-surface text-primary">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1fr_1fr]">
          <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,140,43,0.12),transparent_55%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-background)] to-transparent" />
          </div>
          <div className="flex items-center justify-center px-8 py-12">
            <section className="w-full max-w-sm rounded-2xl border border-border bg-[var(--surface-strong)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
              Login
            </span>
            <h1 className="mt-4 text-[28px] font-semibold text-primary">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-secondary">
              Ingresa tus credenciales para acceder a tu panel
            </p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm text-secondary">
                <span>Correo electronico</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange("email")}
                  required
                  className="mt-2 w-full rounded-lg border border-divider bg-surface px-4 py-2 text-sm text-primary outline-none ring-primary-500 transition focus:ring-2"
                  placeholder="tu@correo.com"
                />
              </label>
              <label className="block text-sm text-secondary">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                  className="mt-2 w-full rounded-lg border border-divider bg-surface px-4 py-2 text-sm text-primary outline-none ring-primary-500 transition focus:ring-2"
                  placeholder="Ingresa tu contrasena"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-secondary">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={onChange("remember")}
                  className="h-3.5 w-3.5 rounded border border-border bg-surface"
                />
                <span>Mantener la sesion iniciada</span>
              </label>
              {error ? (
                <div className="rounded-lg border border-error bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-error)]">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-[var(--color-background)] transition hover:bg-primary-400 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Iniciando..." : "Iniciar sesion"}
              </button>
            </form>
            <div className="mt-5 text-center text-xs text-secondary">
              O inicia sesion con
            </div>
            <button
              type="button"
              onClick={onGoogleLogin}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-divider bg-border px-4 py-2 text-sm text-primary"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-4 w-4"
              >
                <path
                  fill="var(--color-error)"
                  d="M24 9.5c3.1 0 5.7 1.1 7.9 2.9l5.9-5.9C34 3.5 29.4 1.5 24 1.5 14.9 1.5 7.1 6.7 3.4 14.3l6.9 5.3C12.1 13.8 17.6 9.5 24 9.5z"
                />
                <path
                  fill="var(--color-info)"
                  d="M24 46.5c5.4 0 10-1.8 13.3-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.7 2-6.4 0-11.8-4.3-13.6-10.1l-6.9 5.3C7.1 41.3 14.9 46.5 24 46.5z"
                />
                
                <path
                  fill="var(--color-success)"
                  d="M10.3 28.4c-1-2.9-1-6.1 0-9l-6.9-5.3c-3 6-3 13.6 0 19.6l6.9-5.3z"
                />
                <path
                  fill="var(--color-warning)"
                  d="M46.5 24.5c0-1.6-.1-2.7-.4-4H24v7.6h12.7c-.3 2-1.9 5-5.4 7.1l6.6 5.1c3.8-3.5 5.9-8.6 5.9-14.8z"
                />
              </svg>
              <span>Google</span>
            </button>
            </section>
          </div>
        </div>
    </div>
  );
}
