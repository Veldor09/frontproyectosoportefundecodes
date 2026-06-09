// src/lib/auth.ts
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getJwtPayload<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    // JWT: header.payload.signature
    const payload = token.split('.')[1];
    const json = atob(payload);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Verifica si el JWT incluye TODOS los permisos requeridos.
 * Nota: en el backend pusimos perms en el payload (AuthService.login).
 */
export function hasPermissions(required: string[], token: string | null): boolean {
  const payload = getJwtPayload<{ perms?: string[] }>(token);
  const userPerms = new Set(payload?.perms ?? []);
  return required.every(p => userPerms.has(p));
}

/** Verifica si el JWT incluye AL MENOS UNO de los permisos requeridos. */
export function hasAnyPermission(options: string[], token: string | null): boolean {
  const payload = getJwtPayload<{ perms?: string[] }>(token);
  const userPerms = new Set(payload?.perms ?? []);
  return options.some(p => userPerms.has(p));
}
