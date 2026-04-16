import { ApiResponse } from "@/types/api-types";
import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type Method,
} from "axios";
import { authStorage } from "./auth-storage";

const defaultBaseUrl = "http://localhost:8000";

const envBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  defaultBaseUrl;

const normalizedBaseUrl = envBaseUrl.replace(/\/$/, "");
export const API_BASE_URL = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl.slice(0, -4)
  : normalizedBaseUrl;

const ENABLE_PAYLOAD_ENCRYPTION =
  process.env.NEXT_PUBLIC_ENABLE_PAYLOAD_ENCRYPTION === "true";

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  const normalized = new Headers(headers);
  return Object.fromEntries(normalized.entries());
}

function encodePayload(data: unknown): string {
  const json = JSON.stringify(data);
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(unescape(encodeURIComponent(json)));
  }

  return Buffer.from(json, "utf-8").toString("base64");
}

const httpClient = axios.create();
let refreshPromise: Promise<string | null> | null = null;

type RetryableAxiosConfig = AxiosRequestConfig & { _retry?: boolean };

function shouldSkipAuthRefresh(config?: AxiosRequestConfig): boolean {
  const url = config?.url ?? "";
  return url.includes("/api/auth/login/") || url.includes("/api/auth/refresh/");
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const storedTokens = authStorage.getTokens();
    if (!storedTokens?.refresh) {
      return null;
    }

    try {
      const refreshUrl = `${API_BASE_URL}/api/auth/refresh/`;
      const response = await axios.post<ApiResponse<{ access: string }>>(
        refreshUrl,
        { refresh: storedTokens.refresh },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const payload = response.data;
      if (!payload.success || !payload.data?.access) {
        return null;
      }

      const persist = authStorage.isPersistent();
      const nextTokens = {
        access: payload.data.access,
        refresh: storedTokens.refresh,
      };

      authStorage.setTokens(nextTokens, persist);
      return nextTokens.access;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

httpClient.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();

  const token = authStorage.getTokens()?.access || null;

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  const isFormData = config.data instanceof FormData;


  if (isFormData) {
    return config;
  }

  const shouldEncrypt =
    ENABLE_PAYLOAD_ENCRYPTION &&
    !isFormData &&
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    config.data !== undefined;

  if (!shouldEncrypt) {
    return config;
  }

  config.data = {
    payload: encodePayload(config.data),
  };

  const headers = AxiosHeaders.from(config.headers);
  headers.set("X-Payload-Encrypted", "true");
  config.headers = headers;

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableAxiosConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      shouldSkipAuthRefresh(config)
    ) {
      return Promise.reject(error);
    }

    config._retry = true;
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      authStorage.clearAll();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:session-expired"));
      }
      return Promise.reject(error);
    }

    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders();

    if (config.headers && !(config.headers instanceof AxiosHeaders)) {
      const rawHeaders = config.headers as Record<string, unknown>;
      for (const [key, value] of Object.entries(rawHeaders)) {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value));
        }
      }
    }
    headers.set("Authorization", `Bearer ${newAccessToken}`);
    config.headers = headers;

    return httpClient.request(config);
  },
);

export async function requestJson<T>(
  input: string,
  options: RequestInit,
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const axiosConfig: AxiosRequestConfig = {
    url: input,
    method: (options.method as Method | undefined) || "GET",
    headers: {
      ...(isFormData ? {} : {
        "Content-Type": "application/json",
        ...normalizeHeaders(options.headers),
      }),
    },
  };

  if (options.body) {
    if (typeof options.body === "string") {
      try {
        axiosConfig.data = JSON.parse(options.body);
      } catch {
        axiosConfig.data = options.body;
      }
    } else {
      axiosConfig.data = options.body;
    }
  }

  try {
    const response = await httpClient.request<ApiResponse<T>>(axiosConfig);

    const payload = response.data;

    if (!payload.success) {
      throw payload;
    }

    return payload.data;  
  } catch (error: unknown) {
    
    if (axios.isAxiosError(error) && error.response?.data) {
      throw error.response.data;
    }
    throw error;
  }
}