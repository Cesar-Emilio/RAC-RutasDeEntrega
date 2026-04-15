import { API_BASE_URL, requestJson } from "./http";
import type {
  Route,
  RouteDetail,
  CreateRoutePayload,
  RouteTableItem,
} from "@/types/routes-types";

export async function getDeliveriesRequest() {
  return requestJson<RouteTableItem[]>(`${API_BASE_URL}/api/deliveries/`, {
    method: "GET",
  })
}

export async function createRouteRequest(
  payload: CreateRoutePayload
) {
  const formData = new FormData();
  formData.append("warehouse", String(payload.warehouse));
  formData.append("file_type", payload.file_type);
  formData.append("file", payload.file);

  return requestJson<Route>(`${API_BASE_URL}/api/deliveries/create/`, {
    method: "POST",
    body: formData,
  });
}

export async function getRouteByIdRequest(id: string) {
  return requestJson<RouteDetail>(
    `${API_BASE_URL}/api/deliveries/${id}`,
    {
      method: "GET",
    }
  );
}