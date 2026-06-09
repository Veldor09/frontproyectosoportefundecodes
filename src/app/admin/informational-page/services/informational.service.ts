import type { InformationalPage, Collaborator, CommentItem } from "../types/informational";

// Resuelve la base API. Prioriza NEXT_PUBLIC_API_URL (backend NestJS completo),
// y como último recurso usa el rewrite /api del next.config.ts.
function apiRoot(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  if (!base) return "/api"; // pasa por el rewrite del frontend
  return base.endsWith("/api") ? base : `${base}/api`;
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ===== CRUD PRINCIPAL =====
export async function getInformationalPage(): Promise<InformationalPage> {
  const res = await fetch(`${apiRoot()}/informational-page`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar la página informativa");
  return res.json();
}

export async function updateInformationalPage(payload: InformationalPage): Promise<InformationalPage> {
  const res = await fetch(`${apiRoot()}/informational-page`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al guardar la página informativa");
  return res.json();
}

// ===== CRUD Colaboradores =====
export async function addCollaborator(newColab: Collaborator) {
  const res = await fetch(`${apiRoot()}/informational-page/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(newColab),
  });
  if (!res.ok) throw new Error("Error al agregar colaborador");
  return res.json();
}

export async function deleteCollaborator(id: string) {
  const res = await fetch(`${apiRoot()}/informational-page/collaborators/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Error al eliminar colaborador");
  return res.json();
}

// ===== CRUD Comentarios =====
export async function addComment(newComment: CommentItem) {
  const res = await fetch(`${apiRoot()}/informational-page/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(newComment),
  });
  if (!res.ok) throw new Error("Error al agregar comentario");
  return res.json();
}

export async function deleteComment(id: string) {
  const res = await fetch(`${apiRoot()}/informational-page/comments/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Error al eliminar comentario");
  return res.json();
}
