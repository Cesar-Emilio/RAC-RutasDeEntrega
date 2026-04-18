import { createRouteRequest } from "@/lib/routes-api";
import { getWarehousesRequest } from "@/lib/warehouses-api";
import { CreateRoutePayload } from "@/types/routes-types";
import { Warehouse } from "@/types/warehouses-types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WarehouseSelect } from "./form/warehouse-select";
import { FileUpload } from "./form/file-upload";
import { RouteOptions } from "./form/special-options";

interface FormState {
  warehouse: number | null;
  file: File | null;
  allowOutOfState: boolean;
  kOpt: number;
}

export function NewRouteForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    warehouse: null,
    file: null,
    allowOutOfState: false,
    kOpt: 0,
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [errorWarehouses, setErrorWarehouses] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehousesRequest();
        setWarehouses(data);
      } catch (error) {
        setErrorWarehouses("Error al cargar almacenes");
      } finally {
        setLoadingWarehouses(false);
      }
    };

    fetchWarehouses();
  }, []);

  const handleSubmit = async () => {
    if (!form.warehouse) {
      alert("Selecciona un almacén");
      return;
    }

    if (!form.file) {
      alert("Selecciona un archivo");
      return;
    }

    const payload: CreateRoutePayload = {
      warehouse: form.warehouse,
      file: form.file,
      file_type: form.file.name.endsWith(".csv") ? "csv" : form.file.name.endsWith(".json") ? "json" : "xlsx",
      k_opt: form.kOpt,
    };

    try {
      setSubmitting(true);

      const response = await createRouteRequest(payload);

      router.push(`/company/routes/${response.id}`);
    } catch (err: any) {
      console.log(err)
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-text-primary mb-3">
          Nuevo cálculo de ruta de entrega
        </h2>

        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Sube un archivo y calcula la ruta de entrega más eficiente.
        </p>
      </div>

      <WarehouseSelect
        warehouses={warehouses}
        selectedId={form.warehouse}
        loading={loadingWarehouses}
        error={errorWarehouses}
        onSelect={(warehouse) =>
          setForm((prev) => ({
            ...prev,
            warehouse: warehouse.id,
          }))
        }
      />

      <FileUpload
        file={form.file}
        onChange={(file) =>
          setForm((prev) => ({
            ...prev,
            file,
          }))
        }
      />

      <RouteOptions
        kOpt={form.kOpt}
        allowOutOfState={form.allowOutOfState}
        onKOptChange={(value) =>
          setForm((prev) => ({
            ...prev,
            kOpt: Math.max(0, Math.min(10, value || 0)),
          }))
        }
        onToggle={() =>
          setForm((prev) => ({
            ...prev,
            allowOutOfState: !prev.allowOutOfState,
          }))
        }
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="
          w-full py-3.5 rounded-lg
          bg-primary-500 hover:bg-primary-400
          text-white font-medium
          disabled:opacity-70
        "
      >
        {submitting ? "Calculando entrega..." : "Calcular entrega óptima"}
      </button>
    </div>
  );
}