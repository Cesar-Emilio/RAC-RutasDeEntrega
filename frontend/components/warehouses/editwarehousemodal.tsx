"use client";

import { useAlert } from "@/components/layout/AlertProvider";
import { updateWarehouseRequest } from "@/lib/warehouses-api";
import { warehouseSchema, type WarehouseFormErrors } from "@/schemas/warehouse-schema";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WarehouseData } from "./warehousetable";

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

interface Props {
  warehouse: WarehouseData | null; 
  onClose: () => void;
  onSaved: () => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</label>
      {children}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder, error }: {
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
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-surface border rounded-xl text-sm transition-all focus:outline-none cursor-pointer ${
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
            <div className="max-h-48 overflow-y-auto py-1">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                    value === opt ? "bg-primary-500 text-white font-medium" : "text-text-secondary hover:bg-surface hover:text-text-primary"
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

function CoordInput({ label, value, onChange, placeholder, error, step = 0.0001 }: {
  label: string; value: string; onChange: (val: string) => void;
  placeholder: string; error?: string; step?: number;
}) {
  const increment = () => onChange(((parseFloat(value) || 0) + step).toFixed(4));
  const decrement = () => onChange(((parseFloat(value) || 0) - step).toFixed(4));
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className={`flex items-center bg-surface border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary-500/20 ${
        error ? "border-red-500" : "border-border focus-within:border-primary-500"
      }`}>
        <button type="button" onClick={decrement} className="px-3 py-2.5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors border-r border-border cursor-pointer">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number" step="any" value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" onClick={increment} className="px-3 py-2.5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors border-l border-border cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

export function EditWarehouseModal({ warehouse, onClose, onSaved }: Props) {
  const { addAlert } = useAlert();
  const [formData, setFormData] = useState<FormData>({
    name: "", address: "", city: "", state: "",
    postal_code: "", latitude: "", longitude: "",
  });
  const [errors, setErrors] = useState<WarehouseFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!warehouse) return;
    setFormData({
      name: warehouse.name ?? "",
      address: warehouse.address ?? "",
      city: warehouse.city ?? "",
      state: warehouse.state ?? "",
      postal_code: warehouse.postal_code ?? "",
      latitude: String(warehouse.latitude ?? ""),
      longitude: String(warehouse.longitude ?? ""),
    });
    setErrors({});
    setApiError(null);
  }, [warehouse]);

  if (!warehouse) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof WarehouseFormErrors])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const result = warehouseSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: WarehouseFormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof WarehouseFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    try {
      setLoading(true);
      await updateWarehouseRequest(warehouse.id, {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      addAlert("success", "Almacén actualizado correctamente");
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.message || err?.detail || "Error al actualizar";
      setApiError(msg);
      addAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
      error ? "border-red-500" : "border-border focus:border-primary-500"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[var(--color-surface-elevated,#1e1e2e)] border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Editar almacén</h2>
            <p className="text-xs text-text-muted mt-0.5">{warehouse.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
              {apiError}
            </div>
          )}

          <form id="edit-warehouse-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Datos del almacén
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed" />
                </Field>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Coordenadas
              </h3>
              <p className="text-xs text-text-muted mb-4">Requeridas para ubicar el almacén en el mapa</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CoordInput
                  label="Latitud" value={formData.latitude} placeholder="19.4326" error={errors.latitude}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, latitude: val }));
                    if (errors.latitude) setErrors((prev) => ({ ...prev, latitude: undefined }));
                  }}
                />
                <CoordInput
                  label="Longitud" value={formData.longitude} placeholder="-99.1332" error={errors.longitude}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, longitude: val }));
                    if (errors.longitude) setErrors((prev) => ({ ...prev, longitude: undefined }));
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-warehouse-form"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}