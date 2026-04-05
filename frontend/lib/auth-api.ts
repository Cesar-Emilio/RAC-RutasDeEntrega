import type { AuthResponse, AuthTokens, AuthUser } from "./auth-types";
import { API_BASE_URL, requestJson } from "./http";

export async function loginRequest(email: string, password: string) {
  const payload = { email, password };
  return requestJson<
    AuthResponse<{ access: string; refresh: string; user: AuthUser }>
  >(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshRequest(refresh: string) {
  return requestJson<AuthResponse<{ access: string }>>(
    `${API_BASE_URL}/api/auth/refresh/`,
    {
      method: "POST",
      body: JSON.stringify({ refresh }),
    },
  );
}

export async function meRequest(access: string) {
  return requestJson<AuthResponse<{ user: AuthUser }>>(
    `${API_BASE_URL}/api/auth/me/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
      },
    },
  );
}

export async function logoutRequest(access: string) {
  return requestJson<AuthResponse<null>>(`${API_BASE_URL}/api/auth/logout/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
    },
  });
}

export function normalizeTokens(access: string, refresh: string): AuthTokens {
  return { access, refresh };
}
