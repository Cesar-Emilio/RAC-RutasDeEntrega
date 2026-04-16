import type { AuthTokens, AuthUser } from "./auth-types";
import { API_BASE_URL, requestJson } from "./http";

export async function loginRequest(email: string, password: string) {
  const payload = { email, password };
  return requestJson<{ access: string; refresh: string; user: AuthUser }>
    (`${API_BASE_URL}/api/auth/login/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
}

export async function refreshRequest(refresh: string) {
  return requestJson<{ access: string }>(
    `${API_BASE_URL}/api/auth/refresh/`,
    {
      method: "POST",
      body: JSON.stringify({ refresh }),
    },
  );
}

// CAMBIO: se elimina el parámetro 'access' — el interceptor de Axios en http.ts
// ya inyecta el header Authorization automáticamente desde authStorage
export async function meRequest() {
  return requestJson<{ user: AuthUser }>(
    `${API_BASE_URL}/api/auth/me/`,
    {
      method: "GET",
    },
  );
}

// CAMBIO: se elimina el parámetro 'access' — el interceptor de Axios en http.ts
// ya inyecta el header Authorization automáticamente desde authStorage
export async function logoutRequest(refresh: string) {
  return requestJson<null>(`${API_BASE_URL}/api/auth/logout/`, {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export function normalizeTokens(access: string, refresh: string): AuthTokens {
  return { access, refresh };
}
