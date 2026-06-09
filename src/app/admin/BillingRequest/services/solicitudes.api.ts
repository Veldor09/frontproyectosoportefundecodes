"use client";

import axiosInstance from "./axiosInstance";

/* =========================
 * Configuración base
 * ========================= */
export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function url(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${p}`;
}

function handleAxiosError(err: any): never {
  if (err.response) {
    const msg =
      err.response.data?.message ||
      err.response.data?.error ||
      `HTTP ${err.response.status} ${err.response.statusText}`;
    throw new Error(msg);
  } else if (err.request) {
    throw new Error("No se recibió respuesta del servidor.");
  } else {
    throw new Error(err.message || "Error desconocido.");
  }
}

/* =========================
 * Tipos
 * ========================= */
export type EstadoContadora = "VALIDADA" | "PENDIENTE" | "DEVUELTA";
export type EstadoDirector = "APROBADA" | "RECHAZADA" | "PENDIENTE";
export type TipoOrigenSolicitud = "PROGRAMA" | "PROYECTO" | "AREA";

export interface UsuarioSolicitante {
  id: number;
  name: string | null;
  email: string;
}

export interface ProgramaRef {
  id: number;
  nombre: string;
}

export interface ProyectoRef {
  id: number;
  title: string;
  slug?: string;
}

export interface AreaRef {
  id: number;
  nombre: string;
}

export interface Solicitud {
  id: number;
  titulo: string;
  descripcion: string | null;
  archivos: string[];

  usuarioId: number | null;
  /** Datos del usuario que creó la solicitud — los incluye el back en findAll/findOne. */
  usuario?: UsuarioSolicitante | null;

  /** Monto solicitado (Decimal serializado como string desde Prisma). */
  monto: string | number | null;

  /** Nuevo flujo: área a la que pertenece la solicitud. */
  areaId?: number | null;
  areaOrg?: AreaRef | null;

  /** Flujo legacy */
  tipoOrigen: TipoOrigenSolicitud | null;
  programaId: number | null;
  programa?: ProgramaRef | null;
  projectId: number | null;
  project?: ProyectoRef | null;

  estadoContadora: EstadoContadora;
  estadoDirector: EstadoDirector;
  comentarioContadora?: string | null;
  comentarioDirector?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item del listado: incluye lo necesario para mostrar las tablas
 * (RequestsTable, AccountantValidationTable, DirectorApprovalTable).
 */
export type SolicitudListItem = Pick<
  Solicitud,
  | "id"
  | "titulo"
  | "descripcion"
  | "estadoContadora"
  | "estadoDirector"
  | "monto"
  | "tipoOrigen"
  | "programa"
  | "project"
  | "areaOrg"
  | "usuario"
  | "createdAt"
>;

export type CreateSolicitudPayload = {
  titulo: string;
  descripcion: string;
  /** Monto requerido en CRC (>0). */
  monto: number;
  /** Nuevo flujo: ID del área. Excluye tipoOrigen/programaId/projectId. */
  areaId?: number;
  /** Flujo legacy */
  tipoOrigen?: TipoOrigenSolicitud;
  programaId?: number;
  projectId?: number;
  usuarioId?: number;
  files?: File[];
};

const normalize = (s?: string | null) =>
  (s ?? "").toString().trim().toUpperCase();

/* =========================
 * Endpoints con Axios
 * ========================= */

export async function createSolicitud(
  payload: CreateSolicitudPayload
): Promise<Solicitud> {
  try {
    // Validación cliente — el back también valida, pero preferimos errores tempranos.
    if (!payload.titulo?.trim()) throw new Error("El título es obligatorio.");
    if (!payload.descripcion?.trim()) throw new Error("La descripción es obligatoria.");
    if (!Number.isFinite(payload.monto) || payload.monto <= 0)
      throw new Error("El monto debe ser un número mayor a 0.");
    if (!payload.areaId && !payload.tipoOrigen)
      throw new Error("Selecciona un área de destino.");

    const fd = new FormData();
    fd.set("titulo", payload.titulo);
    fd.set("descripcion", payload.descripcion);
    fd.set("monto", String(payload.monto));
    if (payload.areaId !== undefined)
      fd.set("areaId", String(payload.areaId));
    if (payload.tipoOrigen !== undefined && payload.tipoOrigen !== "AREA")
      fd.set("tipoOrigen", payload.tipoOrigen);
    if (payload.programaId !== undefined)
      fd.set("programaId", String(payload.programaId));
    if (payload.projectId !== undefined)
      fd.set("projectId", String(payload.projectId));
    if (payload.usuarioId !== undefined)
      fd.set("usuarioId", String(payload.usuarioId));
    (payload.files ?? []).forEach((f) => fd.append("archivos", f));

    const { data } = await axiosInstance.post(url("/api/solicitudes"), fd, {
      headers: { ...authHeader() },
      withCredentials: true,
    });
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function fetchSolicitudes(opts?: {
  estado?: EstadoContadora | "TODAS";
  bandeja?: "contadora" | "director";
}): Promise<SolicitudListItem[]> {
  try {
    const { data } = await axiosInstance.get<Solicitud[]>(url("/api/solicitudes"), {
      headers: { ...authHeader() },
      withCredentials: true,
    });

    // El back ya devuelve usuario/programa/project; los preservamos al filtrar.
    let out: Solicitud[] = Array.isArray(data) ? data : [];

    if (opts?.estado && opts.estado !== "TODAS") {
      out = out.filter(
        (r) => normalize(r.estadoContadora) === normalize(opts.estado)
      );
    }
    if (opts?.bandeja === "contadora") {
      out = out.filter((r) => normalize(r.estadoContadora) === "PENDIENTE");
    } else if (opts?.bandeja === "director") {
      out = out.filter((r) => normalize(r.estadoContadora) === "VALIDADA");
    }
    return out;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function getSolicitud(id: number): Promise<Solicitud> {
  try {
    const { data } = await axiosInstance.get<Solicitud>(
      url(`/api/solicitudes/${id}`),
      {
        headers: { ...authHeader() },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function fetchHistorial(id: number): Promise<any[]> {
  try {
    const { data } = await axiosInstance.get<any[]>(
      url(`/api/solicitudes/${id}/historial`),
      {
        headers: { ...authHeader() },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function validateSolicitud(id: number): Promise<Solicitud> {
  try {
    const body = { estadoContadora: "VALIDADA" as const };
    const { data } = await axiosInstance.patch<Solicitud>(
      url(`/api/solicitudes/${id}/validar`),
      body,
      {
        headers: { "Content-Type": "application/json", ...authHeader() },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function returnSolicitud(
  id: number,
  comentario: string
): Promise<Solicitud> {
  try {
    const body = {
      estadoContadora: "DEVUELTA" as const,
      comentarioContadora: comentario,
    };
    const { data } = await axiosInstance.patch<Solicitud>(
      url(`/api/solicitudes/${id}/validar`),
      body,
      {
        headers: { "Content-Type": "application/json", ...authHeader() },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function approveSolicitud(id: number): Promise<Solicitud> {
  try {
    const body = { estadoDirector: "APROBADA" as const };
    const { data } = await axiosInstance.patch<Solicitud>(
      url(`/api/solicitudes/${id}/decision-director`),
      body,
      {
        headers: { "Content-Type": "application/json", ...authHeader() },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function rejectSolicitud(
  id: number,
  comentario: string
): Promise<Solicitud> {
  try {
    const body = {
      estadoDirector: "RECHAZADA" as const,
      comentarioDirector: comentario,
    };
    const { data } = await axiosInstance.patch<Solicitud>(
      url(`/api/solicitudes/${id}/decision-director`),
      body,
      {
        headers: { "Content-Type": "application/json", ...authHeader() },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}
