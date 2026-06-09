import API, { setAuthToken } from "./api";

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name?: string | null;
    roles?: string[];
    perms?: string[];        // del back
    permissions?: string[];  // alias normalizado
    approved?: boolean;
    verified?: boolean;
  };
}

export type User = LoginResponse["user"] & { permissions: string[]; roles: string[] };

/**
 * Inicia sesión y guarda el token para siguientes peticiones.
 */
export async function login(email: string, password: string): Promise<User> {
  try {
    const res = await API.post<LoginResponse>("/auth/login", {
      email: (email || "").trim().toLowerCase(),
      password,
    });

    const token = res.data?.access_token;
    if (!token) {
      throw new Error("Respuesta inválida del servidor (sin token).");
    }

    setAuthToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }

    const rawUser = res.data.user ?? ({} as LoginResponse["user"]);
    const permissions = rawUser.permissions ?? rawUser.perms ?? [];
    const roles = rawUser.roles ?? [];

    // devolvemos usuario normalizado con permissions y roles asegurados
    return { ...rawUser, permissions, roles };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "No se pudo iniciar sesión";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }
}

/**
 * Solicita recuperación de contraseña.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  try {
    const { data } = await API.post<{ ok: true }>("/auth/forgot-password", {
      email: (email || "").trim().toLowerCase(),
    });
    return data ?? { ok: true };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "No se pudo procesar la solicitud.";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }
}

/**
 * Establece la contraseña con el token de invitación.
 */
export async function setPassword(
  token: string,
  newPassword: string,
  confirmPassword?: string
): Promise<{ ok: true }> {
  try {
    const payload: Record<string, any> = { token, newPassword };
    if (confirmPassword !== undefined) payload.confirmPassword = confirmPassword;

    const { data } = await API.post<{ ok: true }>("/auth/set-password", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data ?? { ok: true };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "No se pudo establecer la contraseña.";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }
}

/**
 * Cierra sesión: limpia el token.
 */
export function logout() {
  setAuthToken(undefined);
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

/**
 * Obtiene el token guardado (si existe).
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Reaplica el token guardado (útil al montar la app/SPA).
 */
export function ensureAuthFromStorage() {
  const t = getStoredToken();
  if (t) setAuthToken(t);
}
