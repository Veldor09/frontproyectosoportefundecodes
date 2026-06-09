import {
  apiListCollaborators,
  apiGetCollaborator,
  apiCreateCollaborator,
  apiUpdateCollaborator,
  apiDeactivateCollaborator,
  apiActivateCollaborator,
  apiDeleteCollaborator,
} from "./collaborators.api";

import type {
  Collaborator,
  CreateCollaboratorDto,
  ListCollaboratorsParams,
  Paginated,
} from "@/app/admin/Collaborators/types/collaborators.types";

const BASE = "/collaborators";

/* ---------- Tipos útiles ---------- */
export type Estado = "ACTIVO" | "INACTIVO";
export type EstadoFiltro = "ALL" | Estado;

/* ---------- utilidades ---------- */
function mapItem(x: any): Collaborator {
  return {
    id: x.id,
    fullName: x.fullName ?? x.nombreCompleto ?? x.nombre_completo,
    email: x.email ?? x.correo,
    phone: x.phone ?? x.telefono ?? "",
    role: x.role ?? x.rol,
    status: x.status ?? x.estado,
    identification: x.identification ?? x.cedula,
    birthdate: x.birthdate ?? x.fechaNacimiento ?? x.fecha_nacimiento,
    createdAt: x.createdAt ?? x.created_at,
  } as Collaborator;
}

function cleanParams(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (k === "estado" && v === "ALL") continue; // no enviar ALL al backend
    out[k] = v;
  }
  return out;
}

function formatCedulaForBackend(raw: string): string {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 9)  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
  if (d.length === 10) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

function genTempPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%&*?";
  let out = "";
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

/* ---------- list ---------- */
export async function listCollaborators(
  params: ListCollaboratorsParams & { estado?: EstadoFiltro } = {}
): Promise<Paginated<Collaborator>> {
  const data = await apiListCollaborators(cleanParams({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    q: params.q,
    estado: params.estado,
    rol: (params as any).rol,
  }));

  const itemsRaw = data.items ?? data.data ?? data.results ?? [];
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(mapItem) : [];

  return {
    items,
    total: data.total ?? data.count ?? items.length,
    page: data.page ?? params.page ?? 1,
    pageSize: data.pageSize ?? params.pageSize ?? items.length,
  };
}

/* ---------- get one ---------- */
export async function getCollaborator(id: number | string): Promise<Collaborator> {
  const data = await apiGetCollaborator(id);
  return mapItem(data);
}

/* ---------- create ---------- */
export async function createCollaborator(input: CreateCollaboratorDto): Promise<Collaborator> {
  const password =
    input.password && String(input.password).trim().length >= 8
      ? String(input.password).trim()
      : genTempPassword(12);

  const cedulaFmt = formatCedulaForBackend(input.identification);

  const payload = {
    nombreCompleto: input.fullName.trim(),
    correo: input.email.trim(),
    cedula: cedulaFmt,
    fechaNacimiento: input.birthdate,
    telefono: input.phone,
    rol: input.role,
    password, // el back puede ignorarlo si usa invitación
  };

  // 👇 ESTE endpoint del backend es el que hace el upsert del USER
  const data = await apiCreateCollaborator(payload);
  return mapItem(data);
}

/* ---------- update ---------- */
export async function updateCollaborator(
  id: number | string,
  input: Partial<CreateCollaboratorDto> & { status?: Estado }
): Promise<Collaborator> {
  const patch: any = {};
  if (input.fullName        !== undefined) patch.nombreCompleto = input.fullName;
  if (input.email           !== undefined) patch.correo          = input.email;
  if (input.identification  !== undefined) patch.cedula          = formatCedulaForBackend(input.identification);
  if (input.birthdate       !== undefined) patch.fechaNacimiento = input.birthdate;
  if (input.phone           !== undefined) patch.telefono        = input.phone;
  if (input.role            !== undefined) patch.rol             = input.role;
  if (input.password        !== undefined) patch.password        = input.password;
  if (input.status          !== undefined) patch.estado          = input.status;

  const data = await apiUpdateCollaborator(id, patch);
  return mapItem(data);
}

/* ---------- toggle status ---------- */
export async function toggleCollaboratorStatus(
  id: number | string,
  currentStatus: Estado
): Promise<void> {
  if (currentStatus === "ACTIVO") {
    await apiDeactivateCollaborator(id);
  } else {
    await apiActivateCollaborator(id);
  }
}

/* ---------- delete ---------- */
export async function deleteCollaborator(id: number | string): Promise<void> {
  await apiDeleteCollaborator(id);
}
