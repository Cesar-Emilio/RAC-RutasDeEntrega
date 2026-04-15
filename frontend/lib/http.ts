import { ApiResponse } from "@/types/api-types";
import axios, {
  AxiosHeaders,
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