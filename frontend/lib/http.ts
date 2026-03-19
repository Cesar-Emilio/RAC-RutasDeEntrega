const defaultBaseUrl = "http://localhost:8000";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || defaultBaseUrl
).replace(/\/$/, "");

export async function requestJson<T>(
  input: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = (await response.json()) as T;
  if (!response.ok) {
    throw data;
  }
  return data;
}
