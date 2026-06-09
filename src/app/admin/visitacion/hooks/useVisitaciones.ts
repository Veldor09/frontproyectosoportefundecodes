"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { visitacionService } from "../services/visitacion.service";
import type { Visitacion, VisitacionCreateInput, VisitacionUpdateInput } from "../types/visitacion";

const PAGE_SIZE = 10;

export interface UseVisitacionesReturn {
  items: Visitacion[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setSearch: (q: string) => void;
  refresh: () => void;
  save: (payload: VisitacionCreateInput & { id?: number }) => Promise<Visitacion>;
  remove: (id: number) => Promise<void>;
}

export function useVisitaciones(): UseVisitacionesReturn {
  const [items, setItems] = useState<Visitacion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(
    async (currentPage: number, q: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const res = await visitacionService.list({ page: currentPage, limit: PAGE_SIZE, q: q || undefined });
        setItems(res.data);
        setTotal(res.total);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          setError((err as Error)?.message ?? "Error al cargar visitaciones");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(page, search);
  }, [load, page, search]);

  function setSearch(q: string) {
    setSearchRaw(q);
    setPage(1);
  }

  function refresh() {
    void load(page, search);
  }

  async function save(payload: VisitacionCreateInput & { id?: number }): Promise<Visitacion> {
    const { id, ...rest } = payload;
    let result: Visitacion;
    if (id != null) {
      result = await visitacionService.update(id, rest as VisitacionUpdateInput);
    } else {
      result = await visitacionService.create(rest as VisitacionCreateInput);
    }
    await load(page, search);
    return result;
  }

  async function remove(id: number): Promise<void> {
    await visitacionService.remove(id);
    const newPage = items.length === 1 && page > 1 ? page - 1 : page;
    setPage(newPage);
    await load(newPage, search);
  }

  return {
    items,
    total,
    page,
    totalPages,
    search,
    loading,
    error,
    setPage,
    setSearch,
    refresh,
    save,
    remove,
  };
}
