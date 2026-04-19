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
    // CAMBIO: se agrega trailing slash para coincidir con el patrón <int:pk>/ del backend
    `${API_BASE_URL}/api/deliveries/${id}/`,
    {
      method: "GET",
    }
  );
}

export async function sendCoordinates(coords: any) {
  if (coords.length < 2) return null;

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        Authorization: process.env.NEXT_PUBLIC_ORS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates: coords }),
    }
  );

  if (!res.ok) throw new Error(`ORS error: ${res.status}`);
  return res.json();
}