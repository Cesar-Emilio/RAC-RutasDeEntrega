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
    } catch {
      setError("Invalid credentials or inactive account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login/`;
  };

  return (
    <div className="min-h-screen bg-[#0f1217] text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <div className="hidden bg-[#0e1116] lg:block" />
        <div className="flex items-center justify-center px-6 py-12">
          <section className="w-full max-w-sm rounded-2xl bg-[#0f1217]">
            <h1 className="text-2xl font-semibold text-[#e5e7eb]">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-[#a1a1aa]">
              Ingresa tus credenciales para acceder a tu panel
            </p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm text-[#cbd5f5]">
                Correo electronico
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange("email")}
                  required
                  className="mt-2 w-full rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2 text-sm text-white outline-none ring-[#f59e0b]/40 transition focus:ring-2"
                  placeholder="tu@correo.com"
                />
              </label>
              <label className="block text-sm text-[#cbd5f5]">
                Contrasena
                <input
                  type="password"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                  className="mt-2 w-full rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2 text-sm text-white outline-none ring-[#f59e0b]/40 transition focus:ring-2"
                  placeholder="Ingresa tu contrasena"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={onChange("remember")}
                  className="h-3.5 w-3.5 rounded border border-[#1f2937] bg-[#111827]"
                />
                Mantener la sesion iniciada
              </label>
              {error ? (
                <div className="rounded-lg border border-[#7c2d12] bg-[#29150f] px-3 py-2 text-xs text-[#fdba74]">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#fb923c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Iniciando..." : "Iniciar sesion"}
              </button>
            </form>
            <div className="mt-5 text-center text-xs text-[#9ca3af]">
              O inicia sesion con
            </div>
            <button
              type="button"
              onClick={onGoogleLogin}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2 text-sm text-[#e5e7eb]"
            >
              <span className="text-base">G</span>
              Google
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
