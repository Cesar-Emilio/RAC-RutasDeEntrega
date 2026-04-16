"use client";

import { useState, useRef, type DragEvent, type ChangeEvent, useEffect } from "react";
import { ChevronDown, Loader2, Upload } from "lucide-react";
import { Warehouse } from "@/types/warehouses-types";
import { getWarehousesRequest } from "@/lib/warehouses-api";
import { createRouteRequest } from "@/lib/routes-api";
import { CreateRoutePayload } from "@/types/routes-types";
import { useRouter } from "next/navigation";

interface FormState {
  warehouse: number | null;
  file: File | null;
  allowOutOfState: boolean;
}

export function NewRouteForm() {
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>({
    warehouse: null,
    file: null,
    allowOutOfState: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [errorWarehouses, setErrorWarehouses] = useState<string | null>(null);
  const [submittingRoute, setSubmittingRoute] = useState(false);

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        setLoadingWarehouses(true);
        setErrorWarehouses(null);

        const data = await getWarehousesRequest();
        setWarehouses(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al cargar almacenes";
        setErrorWarehouses(message);
      } finally {
        setLoadingWarehouses(false);
      }
    }

    fetchWarehouses();
  }, []);

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setFormState((prev) => ({
        ...prev,
        warehouse: warehouse.id,
    }));
    setIsDropdownOpen(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".json"))
    ) {
      setFormState((prev) => ({ ...prev, file: droppedFile }));
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFormState((prev) => ({ ...prev, file: selectedFile }));
    }
  };

  const handleToggle = () => {
    setFormState((prev) => ({
      ...prev,
      allowOutOfState: !prev.allowOutOfState,
    }));
  };

  const handleSubmit = async () => {
    if (!formState.warehouse) {
        //TODO: Validación de formulario
        alert("Selecciona un almacén");
        return;
    }

    if (!formState.file) {
        alert("Selecciona un archivo");
        return;
    }

    const fileType = formState.file.name.endsWith(".csv")
        ? "csv"
        : "json";

    const payload: CreateRoutePayload = {
        warehouse: formState.warehouse,
        file: formState.file,
        file_type: fileType,
    };

    try {
        setSubmittingRoute(true);
        const data = await createRouteRequest(payload);
        router.push(`/company/routes/${data.id}`)
    } catch (err: any) {
        console.log(err)
    } finally {
        setSubmittingRoute(false);
    }
  };

  const warehouse = warehouses.find(
    (w) => w.id === formState.warehouse,
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-text-primary mb-3">
          Nuevo cálculo de ruta
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto">
          Sube un archivo con las ubicaciones de los paquetes a entregar y
          calcula la ruta más eficiente desde un almacén de partida
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-medium">
            1
          </span>
          <div>
            <h3 className="text-base font-medium text-text-primary">
              Almacén de partida
            </h3>
            <p className="text-sm text-text-secondary">
              Selecciona el almacén desde donde saldrán los paquetes
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loadingWarehouses || !!errorWarehouses}
            className="
              w-full flex items-center justify-between
              px-4 py-3 rounded-lg
              bg-surface border border-border
              text-left
              hover:border-divisor
              transition-colors duration-200
              disabled:cursor-not-allowed disabled:opacity-70
            "
          >
            {loadingWarehouses ? (
              <span className="flex items-center gap-2 text-text-secondary">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando almacenes...
              </span>
            ) : (
              <span
                className={
                  warehouse ? "text-text-primary" : "text-text-secondary"
                }
              >
                {warehouse
                  ? warehouse.name
                  : "Seleccionar almacén..."}
              </span>
            )}
            <ChevronDown
              className={`w-5 h-5 text-text-secondary transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {errorWarehouses ? (
            <p className="mt-2 text-sm text-[var(--color-error)]">
              {errorWarehouses}
            </p>
          ) : null}

          {isDropdownOpen && !loadingWarehouses && (
            <div className="absolute z-10 w-full mt-2 py-1 bg-surface border border-border rounded-lg shadow-lg">
              {warehouses.map((warehouse) => (
                <button
                  key={warehouse.id}
                  onClick={() => handleWarehouseSelect(warehouse)}
                  className="
                    w-full px-4 py-2.5 text-left
                    text-text-primary hover:bg-border/50
                    transition-colors duration-200
                  "
                >
                  {warehouse.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-medium">
            2
          </span>
          <div>
            <h3 className="text-base font-medium text-text-primary">
              Archivo de paquetes
            </h3>
            <p className="text-sm text-text-secondary">
              Sube un archivo .csv o .json con las ubicaciones de entrega
            </p>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            py-12 px-6 rounded-xl
            border-2 border-dashed
            transition-colors duration-200
            ${
              isDragging
                ? "border-primary-500 bg-primary-500/10"
                : "border-border bg-surface/50 hover:border-divisor"
            }
          `}
        >
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-surface border border-border">
            <Upload className="w-5 h-5 text-text-secondary" />
          </div>

          {formState.file ? (
            <p className="text-text-primary font-medium">
              {formState.file.name}
            </p>
          ) : (
            <>
              <p className="text-text-primary mb-1">Arrastra tu archivo aquí</p>
              <p className="text-sm text-text-secondary">
                o{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  selecciona un archivo
                </button>{" "}
                de tu computadora
              </p>
            </>
          )}

          <div className="flex items-center gap-4 mt-4">
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .csv
            </span>
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .json
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-medium">
            3
          </span>
          <div>
            <h3 className="text-base font-medium text-text-primary">
              Opciones especiales
            </h3>
            <p className="text-sm text-text-secondary">
              Configura opciones adicionales para el cálculo
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-surface border border-border">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-text-primary mb-1">
              Permitir entrega de paquetes fuera del estado
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Si se activa, la ruta incluirá paquetes cuya dirección de entrega
              se encuentre fuera del estado del almacén de partida.
            </p>
          </div>

          <button
            onClick={handleToggle}
            className={`
              relative flex-shrink-0
              w-11 h-6 rounded-full
              transition-colors duration-200
              ${formState.allowOutOfState ? "bg-primary-500" : "bg-border"}
            `}
            role="switch"
            aria-checked={formState.allowOutOfState}
          >
            <span
              className={`
                absolute top-0.5 left-0.5
                w-5 h-5 rounded-full bg-white
                transition-transform duration-200
                ${formState.allowOutOfState ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submittingRoute}
        className="
          w-full py-3.5 rounded-lg
          bg-primary-500 hover:bg-primary-400
          text-white font-medium
          transition-colors duration-200
          disabled:cursor-not-allowed disabled:opacity-70
        "
      >
        {submittingRoute ? "Calculando ruta..." : "Calcular ruta óptima"}
      </button>
    </div>
  );
}
