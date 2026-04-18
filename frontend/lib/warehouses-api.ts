import { API_BASE_URL, requestJson } from "./http";
import type {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from "@/types/warehouses-types";

export async function getWarehousesRequest() {
  return requestJson<Warehouse[]>(`${API_BASE_URL}/api/warehouses/`, {
    method: "GET",
  });
}

export async function getWarehouseByIdRequest(id: number | string) {
  return requestJson<Warehouse>(
    `${API_BASE_URL}/api/warehouses/${id}/`,
    {
      method: "GET",
    }
  );
}

export async function createWarehouseRequest(
  payload: CreateWarehousePayload
) {
  return requestJson<Warehouse>(`${API_BASE_URL}/api/warehouses/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWarehouseRequest(
  id: number | string,
  payload: CreateWarehousePayload
) {
  return requestJson<Warehouse>(
    `${API_BASE_URL}/api/warehouses/${id}/`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function patchWarehouseRequest(
  id: number | string,
  payload: UpdateWarehousePayload
) {
  return requestJson<Warehouse>(
    `${API_BASE_URL}/api/warehouses/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function toggleWarehouseRequest(id: number | string) {
  return requestJson<Warehouse>(
    `${API_BASE_URL}/api/warehouses/${id}/toggle/`,
    {
      method: "PATCH",
    }
  );
}

export async function deleteWarehouseRequest(id: number | string) {
  return requestJson<null>(
    `${API_BASE_URL}/api/warehouses/${id}/`,
    {
      method: "DELETE",
    }
  );
}