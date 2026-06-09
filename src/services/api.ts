// src/services/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

/** Normaliza que el baseURL termine con /api (sin repetir slashes) */
function normalizeBaseUrl(url: string) {
  const u = (url || '').trim().replace(/\/+$/, '');
  if (!u) return '';
  return u.endsWith('/api') ? u : `${u}/api`;
}

/** Detecta si estamos en vercel/prod (best effort) */
function isProd() {
  if (typeof window !== 'undefined') return !/^localhost(:\d+)?$/i.test(window.location.hostname);
  // En server-side en Vercel suele existir VERCEL=1
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/** Resuelve la base del API en este orden:
 *  1) NEXT_PUBLIC_API_URL (única variable oficial)
 *  2) window.__API_BASE__ (por si se inyecta en HTML)
 *  3) fallback: same-origin (usa el rewrite del next.config.ts)
 */
function resolveApiBase() {
  const envBase =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && (window as any).__API_BASE__);

  if (envBase) return envBase;

  // Fallback: en cliente, same-origin (el rewrite /api/* del next.config.ts
  // enruta al backend). En server-side sin env var, log y usa localhost:4000.
  if (typeof window !== 'undefined') return window.location.origin;
  if (!isProd()) return 'http://localhost:4000';

  // eslint-disable-next-line no-console
  console.warn('[API] NEXT_PUBLIC_API_URL no definida en producción.');
  return '';
}

const RAW_BASE = resolveApiBase();
const API_BASE = normalizeBaseUrl(RAW_BASE);

const API = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // usamos Authorization: Bearer, no cookies
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

/** Helper para setear/quitar token */
export function setAuthToken(token?: string) {
  if (token) {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    delete (API.defaults.headers.common as any)['Authorization'];
  }
}

/** REQUEST: adjunta token + evita doble /api */
API.interceptors.request.use((config) => {
  // Adjunta Bearer si existe
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Evitar /api duplicado si el baseURL ya termina en /api
  const base = (config.baseURL || '').replace(/\/+$/, '');
  let url = config.url || '';

  // Si la URL es absoluta (http/https), no tocamos nada
  if (!/^https?:\/\//i.test(url)) {
    if (base.endsWith('/api')) {
      // /api/auth/login -> /auth/login
      if (/^\/?api\//i.test(url)) url = url.replace(/^\/?api\//i, '/');
      else if (/^\/?api$/i.test(url)) url = '/';
    }
    // Normaliza slashes dobles (preserva http://)
    url = url.replace(/([^:]\/)\/+/g, '$1');
    config.url = url.startsWith('/') ? url : `/${url}`;
  }

  return config;
});

/** RESPONSE: toasts + redirección en 401/403 */
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    // Si no hay respuesta del servidor (timeout, red bloqueada, CORS, adblock)
    if (error && !error.response) {
      // Algunos adblockers generan ERR_BLOCKED_BY_CLIENT
      const msg =
        error?.message?.includes('ERR_BLOCKED_BY_CLIENT')
          ? 'La solicitud fue bloqueada por una extensión del navegador (AdBlock u otra).'
          : 'No se pudo conectar con el servidor. Verifica tu conexión o CORS.';
      toast.error(msg);
      return Promise.reject(error);
    }

    const status = error?.response?.status as number | undefined;
    const data = error?.response?.data;
    const serverMsg =
      data?.message || data?.error || error?.message || 'Error inesperado en la API';

    if (data?.error === 'ACCOUNT_NOT_APPROVED') {
      toast.error(data.message || 'Su cuenta no ha sido aprobada aún');
    } else if (Array.isArray(data?.message)) {
      toast.error(data.message.join(', '));
    } else if (serverMsg) {
      toast.error(serverMsg);
    }

    const reqUrl: string = error?.config?.url ?? '';
    const isLoginCall = /\/auth\/login\b/.test(reqUrl);
    if (status === 401 && !isLoginCall) {
      // Token inválido o expirado: limpiamos sesión y mandamos al login
      setAuthToken(undefined);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 403 && !isLoginCall) {
      // Autenticado pero sin permisos suficientes
      if (window.location.pathname !== '/error/unauthorized') {
        window.location.href = '/error/unauthorized';
      }
    }

    return Promise.reject(error);
  }
);

// (Opcional) pequeño log en cliente para verificar baseURL en producción
if (typeof window !== 'undefined') {
  // Solo una vez por carga
  if (!(window as any).__API_BASE_LOGGED__) {
    (window as any).__API_BASE_LOGGED__ = true;
    // console.info('[API] Base URL:', API_BASE);
  }
}

export default API;
