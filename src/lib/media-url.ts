/**
 * media-url.ts
 *
 * Resuelve URLs de archivos generadas por el backend.
 *
 * Problema: en modo local el backend genera URLs `http://localhost:PORT/uploads/...`
 * que se guardan en la DB y rompen en producción porque el browser no puede
 * alcanzar localhost del servidor.
 *
 * Solución: en el cliente, sustituir el origen localhost por el origen del API
 * configurado en NEXT_PUBLIC_API_URL.
 */

const RAW_API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

function apiOrigin(): string {
  if (!RAW_API) return "";
  try {
    return new URL(RAW_API).origin;
  } catch {
    return RAW_API;
  }
}

/**
 * Convierte una URL de archivo en una URL accesible desde el navegador:
 * - `http://localhost:XXXX/uploads/...` → `https://tu-api.com/uploads/...`
 * - `/uploads/...`                      → `https://tu-api.com/uploads/...`
 * - URL absoluta correcta               → se devuelve sin cambios
 * - null / undefined / ""              → null
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const origin = apiOrigin();

  if (/^https?:\/\//i.test(url)) {
    // Sustituye cualquier origen localhost por el del API de producción
    if (/^https?:\/\/localhost(:\d+)?/i.test(url) && origin) {
      return url.replace(/^https?:\/\/localhost(:\d+)?/i, origin);
    }
    return url;
  }

  // Ruta relativa → añade el origen del API
  if (origin) return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
  return url;
}
