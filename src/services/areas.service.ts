// src/services/areas.service.ts
import API from "./api";

export interface Area {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { proyectos: number; programas: number; colaboradores: number };
  cuenta?: { id: number; nombre: string; codigo: string } | null;
}

export interface AreaSelector {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface AreasListResult {
  items: Area[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateAreaPayload {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

export type UpdateAreaPayload = Partial<CreateAreaPayload>;

// ─── API calls ──────────────────────────────────────────────────────────────

export async function listAreas(params: {
  q?: string;
  activa?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AreasListResult> {
  const qp: Record<string, string> = {};
  if (params.q) qp.q = params.q;
  if (params.activa !== undefined) qp.activa = String(params.activa);
  if (params.page) qp.page = String(params.page);
  if (params.pageSize) qp.pageSize = String(params.pageSize);

  const { data } = await API.get("/api/areas", { params: qp });
  return data;
}

export async function getArea(id: number): Promise<Area> {
  const { data } = await API.get(`/api/areas/${id}`);
  return data;
}

export async function createArea(payload: CreateAreaPayload): Promise<Area> {
  const { data } = await API.post("/api/areas", payload);
  return data;
}

export async function updateArea(id: number, payload: UpdateAreaPayload): Promise<Area> {
  const { data } = await API.patch(`/api/areas/${id}`, payload);
  return data;
}

export async function archiveArea(id: number): Promise<void> {
  await API.post(`/api/areas/${id}/archivar`);
}

export async function restoreArea(id: number): Promise<void> {
  await API.post(`/api/areas/${id}/restaurar`);
}

export async function deleteArea(id: number): Promise<void> {
  await API.delete(`/api/areas/${id}`);
}

/** Lista compacta de áreas activas para usar en selectores de formularios */
export async function listAreasSelector(): Promise<AreaSelector[]> {
  const { data } = await API.get("/api/areas/selector");
  return Array.isArray(data) ? data : [];
}
