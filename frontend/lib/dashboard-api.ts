import type { AuthResponse } from "./auth-types";
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

export async function getDashboardSummary(access: string) {
  return requestJson<AuthResponse<DashboardSummary>>(
    `${API_BASE_URL}/api/dashboard/summary/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
      },
    },
  );
}
