"use client";

import axios from "axios";

export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** ---------- Voluntarios (ruta correcta del BACKEND) ---------- **/

// LIST
export async function apiListVoluntarios(params: {
  q?: string;
  estado?: "ACTIVO" | "INACTIVO";
  page?: number;
  pageSize?: number;
}) {
  const { data } = await axios.get(`${API_URL}/api/voluntarios`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      q: params.q,
      estado: params.estado,
    },
    headers: { ...authHeader() },
  });
  return data;
}

// GET ONE
export async function apiGetVoluntario(id: number | string) {
  const { data } = await axios.get(`${API_URL}/api/voluntarios/${id}`, {
    headers: { ...authHeader() },
  });
  return data;
}

// CREATE
export async function apiCreateVoluntario(payload: any) {
  const { data } = await axios.post(`${API_URL}/api/voluntarios`, payload, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return data;
}

// UPDATE — backend expone PUT /:id, no PATCH
export async function apiUpdateVoluntario(id: number | string, patch: any) {
  const { data } = await axios.put(`${API_URL}/api/voluntarios/${id}`, patch, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return data;
}

// TOGGLE (activar / desactivar) — backend solo expone PATCH /:id/toggle o /:id/toggle-status
export async function apiToggleVoluntario(id: number | string) {
  const { data } = await axios.patch(
    `${API_URL}/api/voluntarios/${id}/toggle`,
    {},
    { headers: { ...authHeader() } }
  );
  return data;
}

// Alias de compatibilidad con el resto del código (equivalen al toggle)
export const apiDeactivateVoluntario = apiToggleVoluntario;
export const apiActivateVoluntario = apiToggleVoluntario;

// DELETE
export async function apiDeleteVoluntario(id: number | string) {
  const { data } = await axios.delete(`${API_URL}/api/voluntarios/${id}`, {
    headers: { ...authHeader() },
  });
  return data;
}
