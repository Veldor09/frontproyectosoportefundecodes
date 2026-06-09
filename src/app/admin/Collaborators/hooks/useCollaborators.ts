"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { API_URL } from "../services/collaborators.api";

export type Estado = "ACTIVO" | "INACTIVO";
export type EstadoFilter = "ALL" | Estado;

export type ApiRole =
  | 'admin'
  | 'colaboradorfactura'
  | 'colaboradorvoluntariado'
  | 'colaboradorproyecto'
  | 'colaboradorcontabilidad'
  | 'colaboradorvisitacion'

export type Collaborator = {
  id: number | string;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  rol: ApiRole;
  /** Todos los roles del colaborador (multi-rol) */
  roles?: ApiRole[];
  cedula: string;
  fechaNacimiento?: string | null;
  estado: Estado;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: Collaborator[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** >>> NUEVO: helpers seguros para headers */
function authHeaders(): HeadersInit {
  const h: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) h.Authorization = `Bearer ${t}`;
  }
  return h;
}
function authJsonHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) h.Authorization = `Bearer ${t}`;
  }
  return h;
}

/** >>> MOD: usa siempre headers de tipo Record<string,string> */
const fetcher = async (url: string) => {
  const r = await fetch(url, {
    headers: authJsonHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `HTTP ${r.status}`);
  }
  return r.json();
};

function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out as Partial<T>;
}

export function useCollaborators() {
  // Estado UI
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoFilter>("ALL");

  // Querystring para la lista
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("q", search.trim());
    if (estado !== "ALL") p.set("estado", estado);
    return p.toString();
  }, [page, pageSize, search, estado]);

  // 🔴 CAMBIO: prefijo /api en todas las llamadas
  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_URL}/api/collaborators?${qs}`,
    fetcher,
    { keepPreviousData: true }
  );

  // Helpers filtros
  const setEstadoAndReset = useCallback((value: EstadoFilter) => {
    setEstado(value);
    setPage(1);
  }, []);
  const setSearchAndReset = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  /* ===================== CRUD ===================== */

  const save = useCallback(
    async (
      payload: Partial<Collaborator> & { id?: number | string } & { password?: string }
    ) => {
      const { id, ...rest } = payload;
      const body = JSON.stringify(compact(rest));
      const url =
        id != null
          ? `${API_URL}/api/collaborators/${id}`           // ← CAMBIO
          : `${API_URL}/api/collaborators`;                // ← CAMBIO
      const method = id != null ? "PATCH" : "POST";

      const r = await fetch(url, {
        method,
        headers: authJsonHeaders(),
        body,
        credentials: "include",
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || `HTTP ${r.status}`);
      }
      const json = await r.json().catch(() => ({}));
      await mutate();
      return json as any;
    },
    [mutate]
  );

  const toggle = useCallback(
    async (id: number | string, currentStatus: Estado) => {
      if (currentStatus === "ACTIVO") {
        const r = await fetch(`${API_URL}/api/collaborators/${id}/deactivate`, { // ← CAMBIO
          method: "PATCH",
          headers: authHeaders(),
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else {
        const r = await fetch(`${API_URL}/api/collaborators/${id}`, {          // ← CAMBIO
          method: "PATCH",
          headers: authJsonHeaders(),
          body: JSON.stringify({ estado: "ACTIVO" }),
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      }
      await mutate();
    },
    [mutate]
  );

  const remove = useCallback(
    async (id: number | string) => {
      const r = await fetch(`${API_URL}/api/collaborators/${id}`, {            // ← CAMBIO
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await mutate();
    },
    [mutate]
  );

  /* ================ Exponer API del hook ================ */
  return {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,

    page, setPage,
    pageSize, setPageSize,
    search, setSearch: setSearchAndReset,
    estado, setEstado: setEstadoAndReset,
    

    save,
    toggle,
    remove,
    refresh: mutate,
  };
}
