// src/services/projects.service.ts
import type { Project, ProjectQuery, ProjectStatus } from "@/lib/projects.types";
import API from "./api";

/* -----------------------------
   📄 Tipos de documentos
----------------------------- */
export type ProjectDocument = {
  id: number;
  url: string;
  name: string;
  mimeType: string;
  size?: number;
  createdAt?: string;
};

/* -----------------------------
   📋 Normalización de listas
----------------------------- */
function normalizeList(
  json: unknown
): { data: Project[]; total?: number; page?: number; pageSize?: number } {
  let data: Project[] = [];
  let total: number | undefined;
  let page: number | undefined;
  let pageSize: number | undefined;

  if (Array.isArray(json)) {
    data = json as Project[];
  } else if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) data = obj.data as Project[];
    else if (Array.isArray(obj.items)) data = obj.items as Project[];
    else if (Array.isArray(obj.results)) data = obj.results as Project[];

    total = Number(obj.total ?? obj.count ?? data.length);
    if (obj.meta && typeof obj.meta === "object") {
      const meta = obj.meta as Record<string, unknown>;
      if (typeof meta.page === "number") page = meta.page;
      if (typeof meta.pageSize === "number") pageSize = meta.pageSize;
    }
  }

  return { data, total, page, pageSize };
}

/* -----------------------------
   🌐 Endpoints API REST
----------------------------- */

// === LISTAR ===
export async function listProjects(params: ProjectQuery = {}) {
  const { data } = await API.get("/projects", { params });
  return normalizeList(data);
}

// === DETALLE ===
export async function getProjectBySlug(slug: string): Promise<Project> {
  const { data } = await API.get(`/projects/${encodeURIComponent(slug)}`);
  return data as Project;
}

// === CREAR ===
export type ProjectCreateInput = {
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverUrl?: string;
  category: string;
  place: string;
  area: string;
  status?: ProjectStatus;
  published?: boolean;
};

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export async function createProject(payload: ProjectCreateInput): Promise<Project> {
  const { data } = await API.post("/projects", payload);
  return data as Project;
}

// === ACTUALIZAR ===
export async function updateProject(id: number, payload: ProjectUpdateInput): Promise<Project> {
  const { data } = await API.patch(`/projects/${id}`, payload);
  return data as Project;
}

// === ELIMINAR ===
export async function removeProject(id: number): Promise<{ success?: boolean } | Project> {
  const res = await API.delete(`/projects/${id}`);
  return res.data ?? { success: true };
}

/* -----------------------------
   📎 Documentos del Proyecto
----------------------------- */

/**
 * Sube un archivo binario directamente al backend (NestJS + Prisma)
 * Endpoint: POST /projects/:id/documents
 * Devuelve el registro ProjectDocument creado.
 */
export async function uploadProjectFile(projectId: number, file: File): Promise<ProjectDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await API.post(`/projects/${projectId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data as ProjectDocument;
}

/**
 * Elimina un documento por ID
 * Endpoint: DELETE /projects/:id/documents/:documentId
 */
export async function deleteProjectFile(
  projectId: number,
  documentId: number
): Promise<{ message: string }> {
  const res = await API.delete(`/projects/${projectId}/documents/${documentId}`);
  return res.data ?? { message: "Documento eliminado" };
}

/**
 * Lista los documentos asociados al proyecto
 * Endpoint: GET /projects/:id/documents
 */
export async function getProjectFiles(projectId: number): Promise<ProjectDocument[]> {
  const { data } = await API.get(`/projects/${projectId}/documents`);
  const items = Array.isArray(data) ? data : [];
  return items.map((d: any) => ({
    id: Number(d.id),
    url: String(d.url),
    name: String(d.name),
    mimeType: String(d.mimeType ?? "application/octet-stream"),
    size: typeof d.size === "number" ? d.size : undefined,
    createdAt: d.createdAt ? String(d.createdAt) : undefined,
  }));
}
