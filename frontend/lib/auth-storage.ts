import type { AuthTokens, AuthUser } from "./auth-types";

const TOKEN_KEY = "rac_tokens";
const USER_KEY = "rac_user";

const getStorage = (persist: boolean) =>
  persist ? window.localStorage : window.sessionStorage;

const getAnyStorageItem = (key: string) => {
  if (typeof window === "undefined") return null;
  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) return sessionValue;
  return window.localStorage.getItem(key);
};

export const authStorage = {
  isPersistent(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(TOKEN_KEY));
  },
  getTokens(): AuthTokens | null {
    const raw = getAnyStorageItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthTokens;
    } catch {
      return null;
    }
  },
  setTokens(tokens: AuthTokens, persist: boolean) {
    if (typeof window === "undefined") return;
    const storage = getStorage(persist);
    storage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    const other = persist ? window.sessionStorage : window.localStorage;
    other.removeItem(TOKEN_KEY);
  },
  clearTokens() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    const raw = getAnyStorageItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  setUser(user: AuthUser, persist: boolean) {
    if (typeof window === "undefined") return;
    const storage = getStorage(persist);
    storage.setItem(USER_KEY, JSON.stringify(user));
    const other = persist ? window.sessionStorage : window.localStorage;
    other.removeItem(USER_KEY);
  },
  clearUser() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  },
  clearAll() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  },
};
