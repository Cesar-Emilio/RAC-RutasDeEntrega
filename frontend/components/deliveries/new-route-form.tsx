import { createRouteRequest } from "@/lib/routes-api";
import { getWarehousesRequest } from "@/lib/warehouses-api";
import { CreateRoutePayload } from "@/types/routes-types";
import { Warehouse } from "@/types/warehouses-types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WarehouseSelect } from "./form/warehouse-select";
import { FileUpload } from "./form/file-upload";
import { RouteOptions } from "./form/special-options";
import { RouteFormErrors, routeSchema } from "@/schemas/route-schema";
import { useAlert } from "@/components/layout/AlertProvider";

interface FormState {
  warehouse: number | null;
  file: File | null;
  kOpt: number;
}

export function NewRouteForm() {
  const router = useRouter();
  const { addAlert } = useAlert();

  const [form, setForm] = useState<FormState>({
    warehouse: null,
    file: null,
    kOpt: 0,
  });

  const [errors, setErrors] = useState<RouteFormErrors>({});
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

  const clearError = (field: keyof RouteFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const result = routeSchema.safeParse({
      warehouse: form.warehouse,
      file: form.file,
    });

    if (!result.success) {
      const fieldErrors: RouteFormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RouteFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateRoutePayload = {
      warehouse: form.warehouse!,
      file: form.file!,
      file_type: form.file!.name.endsWith(".csv")
        ? "csv"
        : form.file!.name.endsWith(".json")
        ? "json"
        : "xlsx",
      k_opt: form.kOpt,
    };

    try {
      setSubmitting(true);
      await createRouteRequest(payload);
      addAlert("success", "Ruta calculada exitosamente");
      router.push(`/company/deliveries`);
    } catch (err: any) {
      addAlert("error", err?.message || "Error al calcular la ruta de entrega");
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

      <div>
        <WarehouseSelect
          warehouses={warehouses}
          selectedId={form.warehouse}
          loading={loadingWarehouses}
          error={errorWarehouses}
          onSelect={(warehouse) => {
            setForm((prev) => ({ ...prev, warehouse: warehouse.id }));
            clearError("warehouse");
          }}
        />
        {errors.warehouse && (
          <p className="text-error text-sm mt-1 -mt-6 mb-8">{errors.warehouse}</p>
        )}
      </div>

      <div>
        <FileUpload
          file={form.file}
          onChange={(file) => {
            setForm((prev) => ({ ...prev, file }));
            clearError("file");
          }}
        />
        {errors.file && (
          <p className="text-error text-sm -mt-6 mb-8">{errors.file}</p>
        )}
      </div>

      <RouteOptions
        kOpt={form.kOpt}
        onKOptChange={(value) =>
          setForm((prev) => ({
            ...prev,
            kOpt: Math.max(0, Math.min(10, value || 0)),
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
          cursor-pointer
        "
      >
        {submitting ? "Calculando entrega..." : "Calcular entrega óptima"}
      </button>
    </div>
  );
}