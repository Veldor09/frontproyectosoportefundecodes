"use client";

import type { Visitacion, VisitacionCreateInput, VisitacionUpdateInput, VisitacionListResponse } from "../types/visitacion";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) h.Authorization = `Bearer ${t}`;
  }
  return h;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

export const visitacionService = {
  list(params?: { page?: number; limit?: number; q?: string }): Promise<VisitacionListResponse> {
    const qs = new URLSearchParams();
    if (params?.page)  qs.set("page",  String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.q)     qs.set("q",     params.q);
    return request(`${API_URL}/api/visitaciones?${qs}`);
  },

  create(payload: VisitacionCreateInput): Promise<Visitacion> {
    return request(`${API_URL}/api/visitaciones`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: VisitacionUpdateInput): Promise<Visitacion> {
    return request(`${API_URL}/api/visitaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id: number): Promise<void> {
    return request(`${API_URL}/api/visitaciones/${id}`, { method: "DELETE" });
  },
};
