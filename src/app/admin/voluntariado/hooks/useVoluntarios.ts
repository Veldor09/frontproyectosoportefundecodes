"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { API_URL } from "../services/voluntarioService";

export type Estado = "ACTIVO" | "INACTIVO";
export type EstadoFilter = "ALL" | Estado;

export type Voluntario = {
  id: number | string;
  nombre: string;
  nacionalidad?: string | null;
  fechaEntrada: string;
  fechaSalida?: string | null;
  ong?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ListResponse = {
  data: Voluntario[]; // 👈 backend devuelve "data"
  total: number;
};

/* ===================== HEADERS ===================== */
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

/* ===================== FETCHER ===================== */
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

/* ===================== HOOK PRINCIPAL ===================== */
export function useVoluntarios() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoFilter>("ALL");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit)); // ✅ backend usa "limit"
    if (search.trim()) p.set("q", search.trim());
    if (estado !== "ALL") p.set("estado", estado);
    return p.toString();
  }, [page, limit, search, estado]);

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_URL}/api/voluntarios?${qs}`,
    fetcher,
    { keepPreviousData: true }
  );

  /* ===================== CRUD ===================== */

  const save = useCallback(
    async (payload: Partial<Voluntario> & { id?: number | string }) => {
      const { id, ...rest } = payload;
      const body = JSON.stringify(compact(rest));
      const url =
        id != null
          ? `${API_URL}/api/voluntarios/${id}`
          : `${API_URL}/api/voluntarios`;
      const method = id != null ? "PUT" : "POST"; // ✅ backend usa PUT

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
    async (id: number | string) => {
      const r = await fetch(`${API_URL}/api/voluntarios/${id}/toggle`, {
        method: "PATCH",
        headers: authJsonHeaders(),
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await mutate();
    },
    [mutate]
  );

  const remove = useCallback(
    async (id: number | string) => {
      const r = await fetch(`${API_URL}/api/voluntarios/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await mutate();
    },
    [mutate]
  );

  /* ===================== OUTPUT ===================== */
  return {
    data: data?.data ?? [], // ✅ backend devuelve { data }
    total: data?.total ?? 0,
    loading: isLoading,
    error,

    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    estado,
    setEstado,

    save,
    toggle,
    remove,
    refresh: mutate,
  };
}
