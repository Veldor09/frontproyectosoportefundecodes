"use client";

import axios from "axios";
import type { Sancion, SancionCreateDTO, SancionUpdateDTO } from "../types/sancion";

export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ============================================================
   📂  API: Sanciones
   ============================================================ */

export type ListSancionesParams = {
  page?: number;
  limit?: number;
  search?: string;
  estado?: "ACTIVA" | "EXPIRADA" | "REVOCADA";
  voluntarioId?: number;
};

export type ListSancionesResponse = {
  data: Sancion[];
  total: number;
  page?: number;
  limit?: number;
};

/* ===================== LIST ===================== */
export async function listSanciones(params: ListSancionesParams = {}): Promise<ListSancionesResponse> {
  const { data } = await axios.get(`${API_URL}/api/sanciones`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search,
      estado: params.estado,
      voluntarioId: params.voluntarioId,
    },
    headers: { ...authHeader() },
  });
  return data;
}

/* ===================== GET ONE ===================== */
export async function getSancion(id: number | string): Promise<Sancion> {
  const { data } = await axios.get(`${API_URL}/api/sanciones/${id}`, {
    headers: { ...authHeader() },
  });
  return data;
}

/* ===================== CREATE ===================== */
export async function createSancion(dto: SancionCreateDTO): Promise<Sancion> {
  const { data } = await axios.post(`${API_URL}/api/sanciones`, dto, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return data;
}

/* ===================== UPDATE ===================== */
export async function updateSancion(dto: SancionUpdateDTO & { id: number }): Promise<Sancion> {
  const { id, ...body } = dto;
  const { data } = await axios.put(`${API_URL}/api/sanciones/${id}`, body, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return data;
}

/* ===================== DELETE ===================== */
export async function deleteSancion(id: number | string): Promise<{ ok: true }> {
  const { data } = await axios.delete(`${API_URL}/api/sanciones/${id}`, {
    headers: { ...authHeader() },
  });
  return data;
}

/* ===================== REVOCAR ===================== */
export async function revocarSancion(id: number | string, revocadaPor?: string): Promise<Sancion> {
  const { data } = await axios.put(
    `${API_URL}/api/sanciones/${id}/revocar`,
    { revocadaPor },
    { headers: { "Content-Type": "application/json", ...authHeader() } }
  );
  return data;
}

/* ===================== ACTIVAS POR VOLUNTARIO ===================== */
export async function getSancionesActivasPorVoluntario(voluntarioId: number): Promise<Sancion[]> {
  const { data } = await axios.get(`${API_URL}/api/sanciones/voluntario/${voluntarioId}/activas`, {
    headers: { ...authHeader() },
  });
  return data;
}
