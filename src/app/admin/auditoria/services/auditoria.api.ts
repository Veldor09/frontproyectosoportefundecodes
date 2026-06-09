"use client";

import axios from "axios";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type AuditoriaItem = {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  detalle: string | null;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: number; name: string | null; email: string } | null;
};

export type AuditoriaListResponse = {
  items: AuditoriaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AuditoriaQuery = {
  page?: number;
  pageSize?: number;
  userId?: number;
  accion?: string;
  entidad?: string;
  entidadId?: string;
  desde?: string; // ISO
  hasta?: string;
  q?: string;
};

export async function fetchAuditoria(
  query: AuditoriaQuery = {},
): Promise<AuditoriaListResponse> {
  try {
    const { data } = await axios.get<AuditoriaListResponse>(
      `${API_URL}/api/auditoria`,
      {
        headers: { ...authHeader() },
        params: query,
        withCredentials: true,
      },
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error("Solo los administradores pueden ver la auditoría.");
    }
    const msg =
      err?.response?.data?.message ?? err?.message ?? "Error al cargar auditoría";
    throw new Error(msg);
  }
}
