"use client";

import { ContentShell } from "@/components/layout/ContentShell";
import { createWarehouseRequest } from "@/lib/warehouses-api";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

interface FormData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
}

// Componente input de texto reutilizable
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

// Select personalizado
function CustomSelect({
  value, onChange, options, placeholder, error,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-surface border rounded-xl text-sm transition-all focus:outline-none ${
          error ? "border-red-500" : open ? "border-primary-500 ring-2 ring-primary-500/20" : "border-border hover:border-primary-500/50"
        } ${value ? "text-text-primary" : "text-text-muted"}`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--color-surface-elevated,#1e1e2e)] border border-border rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === opt
                      ? "bg-primary-500 text-white font-medium"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}
    </div>
  );
}

// Input numérico con botones personalizados
function CoordInput({
  label, value, onChange, placeholder, error, step = 0.0001,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  error?: string;
  step?: number;
}) {
  const increment = () => {
    const current = parseFloat(value) || 0;
    onChange((current + step).toFixed(4));
  };
  const decrement = () => {
    const current = parseFloat(value) || 0;
    onChange((current - step).toFixed(4));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className={`flex items-center bg-surface border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary-500/20 ${
        error ? "border-red-500" : "border-border focus-within:border-primary-500"
      }`}>
        {/* Decrement */}
        <button
          type="button"
          onClick={decrement}
          className="px-3 py-2.5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors border-r border-border"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Input */}
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {/* Increment */}
        <button
          type="button"
          onClick={increment}
          className="px-3 py-2.5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors border-l border-border"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

export default function NuevoAlmacenPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "", address: "", city: "", state: "",
    postal_code: "", latitude: "", longitude: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (formData.name.length < 2) newErrors.name = "Mínimo 2 caracteres";
    if (formData.address.length < 5) newErrors.address = "Mínimo 5 caracteres";
    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(formData.city)) newErrors.city = "Solo letras";
    if (!formData.state) newErrors.state = "Selecciona un estado";
    if (!/^\d{5}$/.test(formData.postal_code)) newErrors.postal_code = "5 dígitos requeridos";

    if (formData.latitude.trim() === "") {
      newErrors.latitude = "La latitud es obligatoria";
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < 14.5 || lat > 32.7)
        newErrors.latitude = "Entre 14.5 y 32.7";
    }

    if (formData.longitude.trim() === "") {
      newErrors.longitude = "La longitud es obligatoria";
    } else {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -118.4 || lng > -86.7)
        newErrors.longitude = "Entre -118.4 y -86.7";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);
    if (!validateForm()) return;

    try {
      setLoading(true);
      await createWarehouseRequest({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      setSuccess("Almacén creado correctamente");
      setTimeout(() => router.push("/company/warehouses"), 1500);
    } catch (err: any) {
      setApiError(err?.message || err?.detail || "Error al crear almacén");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
      error ? "border-red-500" : "border-border focus:border-primary-500"
    }`;

  return (
    <ContentShell
      role="company"
      title="Nuevo almacén"
      breadcrumbs={["Empresa", "Almacenes", "Nuevo"]}
    >
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {apiError && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
              {apiError}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-sm">
              {success}
            </div>
          )}

          <div className="bg-surface rounded-2xl border border-border p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Datos generales */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Datos del almacén</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nombre" error={errors.name}>
                    <input name="name" value={formData.name} onChange={handleChange}
                      placeholder="Ej: Almacén Central" className={inputClass(errors.name)} />
                  </Field>

                  <Field label="Dirección" error={errors.address}>
                    <input name="address" value={formData.address} onChange={handleChange}
                      placeholder="Ej: Av. Reforma 222" className={inputClass(errors.address)} />
                  </Field>

                  <Field label="Ciudad" error={errors.city}>
                    <input name="city" value={formData.city} onChange={handleChange}
                      placeholder="Ej: Ciudad de México" className={inputClass(errors.city)} />
                  </Field>

                  <Field label="Estado" error={errors.state}>
                    <CustomSelect
                      value={formData.state}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, state: val }));
                        if (errors.state) setErrors((prev) => ({ ...prev, state: undefined }));
                      }}
                      options={MEXICAN_STATES}
                      placeholder="Selecciona un estado"
                      error={errors.state}
                    />
                  </Field>

                  <Field label="Código postal" error={errors.postal_code}>
                    <input name="postal_code" value={formData.postal_code} onChange={handleChange}
                      placeholder="Ej: 06600" maxLength={5} className={inputClass(errors.postal_code)} />
                  </Field>

                  <Field label="País">
                    <input value="México" disabled
                      className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed" />
                  </Field>
                </div>
              </div>

              {/* Coordenadas */}
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Coordenadas</h3>
                <p className="text-xs text-text-muted mb-4">Requeridas para ubicar el almacén en el mapa</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CoordInput
                    label="Latitud"
                    value={formData.latitude}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, latitude: val }));
                      if (errors.latitude) setErrors((prev) => ({ ...prev, latitude: undefined }));
                    }}
                    placeholder="19.4326"
                    error={errors.latitude}
                  />
                  <CoordInput
                    label="Longitud"
                    value={formData.longitude}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, longitude: val }));
                      if (errors.longitude) setErrors((prev) => ({ ...prev, longitude: undefined }));
                    }}
                    placeholder="-99.1332"
                    error={errors.longitude}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 rounded-xl border border-border text-sm text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-400 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? "Creando..." : "Crear almacén"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ContentShell>
  );
}