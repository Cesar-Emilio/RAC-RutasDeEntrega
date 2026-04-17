import type { AuthTokens, AuthUser } from "./auth-types";

const TOKEN_KEY = "rac_tokens";
const USER_KEY = "rac_user";

const getStorage = (persist: boolean) =>
  persist ? globalThis.localStorage : globalThis.sessionStorage;

const getAnyStorageItem = (key: string) => {
  if (typeof globalThis === "undefined") return null;
  const sessionValue = globalThis.sessionStorage.getItem(key);
  if (sessionValue) return sessionValue;
  return globalThis.localStorage.getItem(key);
};

export const authStorage = {
  isPersistent(): boolean {
    if (typeof globalThis === "undefined") return false;
    return Boolean(globalThis.localStorage.getItem(TOKEN_KEY));
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
    if (typeof globalThis === "undefined") return;
    const storage = getStorage(persist);
    storage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    const other = persist ? globalThis.sessionStorage : globalThis.localStorage;
    other.removeItem(TOKEN_KEY);
  },
  clearTokens() {
    if (typeof globalThis === "undefined") return;
    globalThis.localStorage.removeItem(TOKEN_KEY);
    globalThis.sessionStorage.removeItem(TOKEN_KEY);
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
    if (typeof globalThis === "undefined") return;
    const storage = getStorage(persist);
    storage.setItem(USER_KEY, JSON.stringify(user));
    const other = persist ? globalThis.sessionStorage : globalThis.localStorage;
    other.removeItem(USER_KEY);
  },
  clearUser() {
    if (typeof globalThis === "undefined") return;
    globalThis.localStorage.removeItem(USER_KEY);
    globalThis.sessionStorage.removeItem(USER_KEY);
  },
  clearAll() {
    if (typeof globalThis === "undefined") return;
    globalThis.localStorage.removeItem(TOKEN_KEY);
    globalThis.localStorage.removeItem(USER_KEY);
    globalThis.sessionStorage.removeItem(TOKEN_KEY);
    globalThis.sessionStorage.removeItem(USER_KEY);
  },
};
