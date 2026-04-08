export type AuthRole = "admin" | "company";

export type AuthUser = {
  id: number | null;
  name: string | null;
  email: string | null;
  role: AuthRole | null;
  company_id: number | null;
  is_active: boolean | null;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type AuthResponse<T> = {
  status: "success" | "error";
  message: string;
  data: T | null;
  errors: Record<string, unknown> | null;
};
