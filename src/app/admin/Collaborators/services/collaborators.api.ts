"use client";

import axios from "axios";

export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** ---------- Colaboradores (ruta correcta del BACKEND) ---------- **/

// LIST
export async function apiListCollaborators(params: {
  q?: string;
  rol?: "ADMIN" | "COLABORADOR";
  estado?: "ACTIVO" | "INACTIVO";
  page?: number;
  pageSize?: number;
}) {
  const { data } = await axios.get(`${API_URL}/api/collaborators`, { // ← CAMBIO
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      q: params.q,
      rol: params.rol,
      estado: params.estado,
    },
    headers: { ...authHeader() },
  });
  return data;
}

// GET ONE
export async function apiGetCollaborator(id: number | string) {
  const { data } = await axios.get(`${API_URL}/api/collaborators/${id}`, { // ← CAMBIO
    headers: { ...authHeader() },
  });
  return data;
}

// CREATE
export async function apiCreateCollaborator(payload: any) {
  const { data } = await axios.post(`${API_URL}/api/collaborators`, payload, { // ← CAMBIO
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return data;
}

// UPDATE
export async function apiUpdateCollaborator(id: number | string, patch: any) {
  const { data } = await axios.patch(`${API_URL}/api/collaborators/${id}`, patch, { // ← CAMBIO
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return data;
}

// TOGGLE (desactivar / activar)
export async function apiDeactivateCollaborator(id: number | string) {
  const { data } = await axios.patch(
    `${API_URL}/api/collaborators/${id}/deactivate`, // ← CAMBIO
    {},
    { headers: { ...authHeader() } }
  );
  return data;
}
export async function apiActivateCollaborator(id: number | string) {
  const { data } = await axios.patch(
    `${API_URL}/api/collaborators/${id}`,            // ← CAMBIO
    { estado: "ACTIVO" },
    { headers: { "Content-Type": "application/json", ...authHeader() } }
  );
  return data;
}

// DELETE
export async function apiDeleteCollaborator(id: number | string) {
  const { data } = await axios.delete(`${API_URL}/api/collaborators/${id}`, { // ← CAMBIO
    headers: { ...authHeader() },
  });
  return data;
}

/** ---------- Colaboradores Externos de Área ---------- **/

export async function apiListExternalCollaborators(params: {
  q?: string;
  areaId?: number;
  rol?: string;
  estado?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await axios.get(`${API_URL}/api/collaborators/external`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      q: params.q,
      areaId: params.areaId,
      rol: params.rol,
      estado: params.estado,
    },
    headers: { ...authHeader() },
  });
  return data;
}

export async function apiCreateExternalCollaborator(payload: {
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  rol: "colaboradorsolicitante" | "colaboradorvoluntariadoexterno";
  areaId: number;
}) {
  const { data } = await axios.post(
    `${API_URL}/api/collaborators/external`,
    payload,
    { headers: { "Content-Type": "application/json", ...authHeader() } }
  );
  return data;
}

export async function apiUpdateExternalCollaborator(id: number | string, patch: {
  nombreCompleto?: string;
  correo?: string;
  telefono?: string | null;
  rol?: string;
  areaId?: number | null;
  estado?: string;
}) {
  const { data } = await axios.patch(
    `${API_URL}/api/collaborators/external/${id}`,
    patch,
    { headers: { "Content-Type": "application/json", ...authHeader() } }
  );
  return data;
}

export async function apiDeleteExternalCollaborator(id: number | string) {
  const { data } = await axios.delete(
    `${API_URL}/api/collaborators/external/${id}`,
    { headers: { ...authHeader() } }
  );
  return data;
}

/** ---------- (Legacy admin/* si aún los usas en alguna vista) ---------- **/
export async function toggleEstado(id: number, estado: "ACTIVO" | "INACTIVO") {
  const { data } = await axios.patch(
    `${API_URL}/api/admin/collaborators/${id}/estado`, // ← CAMBIO
    { estado },
    { headers: { ...authHeader() } }
  );
  return data;
}

export async function removeCollaborator(id: number) {
  const { data } = await axios.delete(`${API_URL}/api/admin/collaborators/${id}`, { // ← CAMBIO
    headers: { ...authHeader() },
  });
  return data;
}
