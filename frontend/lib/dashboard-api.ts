// CAMBIO: se elimina la importación de AuthResponse — ya no se usa en este archivo
import { API_BASE_URL, requestJson } from "./http";

export type DashboardStat = {
  id: number;
  label: string;
  value: number;
};

export type DashboardWarehouse = {
  id: number;
  name: string;
  location: string;
};

export type DashboardActivity = {
  id: string;
  action: string;
  description: string;
  time: string;
  type: "success" | "warning" | "info";
  user: string;
};

export type DashboardSummary = {
  stats: DashboardStat[];
  warehouses: DashboardWarehouse[];
  recentActivity: DashboardActivity[];
};

// CAMBIO: se elimina el parámetro 'access' — el interceptor de Axios en http.ts
// ya inyecta el header Authorization automáticamente desde authStorage.
// CAMBIO: se corrige el tipo genérico de AuthResponse<DashboardSummary> a DashboardSummary
// porque requestJson<T> ya desenvuelve el campo 'data' de la respuesta API.
export async function getDashboardSummary() {
  return requestJson<DashboardSummary>(
    `${API_BASE_URL}/api/dashboard/summary/`,
    {
      method: "GET",
    },
  );
}
