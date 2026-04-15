import { API_BASE_URL, requestJson } from "./http";
import type {
  Route,
  RouteDetail,
  CreateRoutePayload,
} from "@/types/routes-types";

export async function getDeliveriesRequest() {
  return requestJson<Route[]>(`${API_BASE_URL}/api/deliveries/`, {
    method: "GET",
  })
}

export async function createRouteRequest(
  payload: CreateRoutePayload
) {
  return requestJson<Route>(`${API_BASE_URL}/api/deliveries/create/`, {
    method: "POST",
    body: JSON.stringify(payload),
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