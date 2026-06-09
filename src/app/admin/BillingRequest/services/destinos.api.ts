"use client";

import axiosInstance from "./axiosInstance";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── Áreas ───────────────────────────────────────────────────────────────────

export type AreaOpcion = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

export type MiColaborador = {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  roles?: string[];
  areaId: number | null;
  areaOrg: { id: number; nombre: string } | null;
};

/** Lista compacta de áreas activas para el selector del formulario de solicitudes. */
export async function fetchAreasParaSelector(): Promise<AreaOpcion[]> {
  const res = await fetch(`${API_URL}/api/areas/selector`, {
    headers: authHeader() as Record<string, string>,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Saldo disponible de un área (vía su cuenta contable). */
export async function fetchSaldoArea(areaId: number): Promise<SaldoDestino> {
  const res = await fetch(`${API_URL}/api/areas/${areaId}/saldo`, {
    headers: authHeader() as Record<string, string>,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Obtiene el perfil del colaborador autenticado (incluye su área). */
export async function fetchMiColaborador(): Promise<MiColaborador | null> {
  try {
    const res = await fetch(`${API_URL}/api/collaborators/me`, {
      headers: authHeader() as Record<string, string>,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type ProgramaOpcion = {
  id: number;
  nombre: string;
  lugar?: string;
};

export type ProyectoOpcion = {
  id: number;
  title: string;
  slug?: string;
  area?: string;
  category?: string;
};

/**
 * Trae la lista mínima de programas para alimentar el selector
 * del formulario de solicitudes.
 */
export async function fetchProgramasParaSelector(): Promise<ProgramaOpcion[]> {
  const { data } = await axiosInstance.get(
    `${API_URL}/api/programa-voluntariado`,
    { headers: { ...authHeader() }, withCredentials: true },
  );
  // El endpoint puede devolver { items: [...] } o un array directo.
  const items = Array.isArray(data) ? data : data?.items ?? [];
  return items.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    lugar: p.lugar,
  }));
}

/**
 * Trae la lista mínima de proyectos para alimentar el selector
 * del formulario de solicitudes.
 */
export async function fetchProyectosParaSelector(): Promise<ProyectoOpcion[]> {
  const { data } = await axiosInstance.get(`${API_URL}/api/projects`, {
    headers: { ...authHeader() },
    withCredentials: true,
  });
  const items = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
  return items.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    area: p.area,
    category: p.category,
  }));
}

export type SaldoDestino = {
  presupuestoTotal: number;
  ingresos: number;
  egresos: number;
  disponible: number;
  porcentajeUtilizado: number;
};

/**
 * Trae los destinos (proyectos + programas) asignados a un colaboradorfactura.
 * Úsalo cuando el usuario autenticado tiene el rol colaboradorfactura.
 */
export async function fetchDestinosAsignados(collaboratorId: number): Promise<{
  proyectos: ProyectoOpcion[];
  programas: ProgramaOpcion[];
}> {
  const res = await fetch(
    `${API_URL}/api/collaborators/${collaboratorId}/destinos`,
    { headers: authHeader() as Record<string, string> },
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    proyectos: (data?.proyectos ?? []).map((p: any) => ({
      id: p.id,
      title: p.title ?? p.nombre,
      area: p.area,
      category: p.category,
    })),
    programas: (data?.programas ?? []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      lugar: p.lugar,
    })),
  };
}

/** Trae el saldo disponible de un proyecto. */
export async function fetchSaldoProyecto(projectId: number): Promise<SaldoDestino> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/saldo`, {
    headers: authHeader() as Record<string, string>,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Trae el saldo disponible de un programa. */
export async function fetchSaldoPrograma(programaId: number): Promise<SaldoDestino> {
  const res = await fetch(`${API_URL}/api/programa-voluntariado/${programaId}/saldo`, {
    headers: authHeader() as Record<string, string>,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Formatea un Decimal/string/number como CRC sin decimales. */
export function formatCRC(monto: string | number | null | undefined): string {
  if (monto === null || monto === undefined || monto === "") return "—";
  const n = typeof monto === "number" ? monto : Number(monto);
  if (!Number.isFinite(n)) return String(monto);
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Devuelve un string corto con el destino de la solicitud (área, programa o proyecto). */
export function describeDestino(s: {
  tipoOrigen?: string | null;
  programa?: { nombre: string } | null;
  project?: { title: string } | null;
  areaOrg?: { nombre: string } | null;
}): string {
  if ((s as any).areaOrg?.nombre) return (s as any).areaOrg.nombre;
  if (s.tipoOrigen === "PROGRAMA") return s.programa?.nombre ?? "Programa —";
  if (s.tipoOrigen === "PROYECTO") return s.project?.title ?? "Proyecto —";
  return "—";
}

/** Devuelve un string corto del solicitante (nombre o correo). */
export function describeSolicitante(s: {
  usuario?: { name: string | null; email: string } | null;
}): string {
  if (!s.usuario) return "—";
  return s.usuario.name?.trim() || s.usuario.email;
}
