"use client";

import axios from "axios";

export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/* ===================== 🔐 Headers ===================== */
function authHeader() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ===================== 🧭 Helpers ===================== */
function buildQS(params?: Record<string, string | number | boolean>) {
  const base: Record<string, string> = {};

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      base[k] = typeof v === "boolean" ? (v ? "1" : "0") : String(v);
    }
  }

  const qs = new URLSearchParams(base).toString();
  return qs ? `?${qs}` : "";
}

/* ===================== 🧩 Tipos ===================== */

export type OrigenVoluntariado = "CUENTA_PROPIA" | "INTERMEDIARIO";

export type AsignacionProgramaPayload = {
  pagoRealizado: boolean;
  origen: OrigenVoluntariado;
  intermediario?: string | null;
  fechaEntrada: string;
  fechaSalida?: string | null;
  horasTotales: number;
};

/* ===================== 📦 CRUD Programas ===================== */

export async function createProgramaVoluntariado(payload: {
  nombre: string;
  lugar: string;
  descripcion?: string;
  limiteParticipantes?: number;
}) {
  const { data } = await axios.post(
    `${API_URL}/api/programa-voluntariado`,
    payload,
    {
      headers: { ...authHeader() },
    }
  );

  return data;
}

export async function updateProgramaVoluntariado(
  id: string | number,
  payload: {
    nombre?: string;
    lugar?: string;
    descripcion?: string;
    limiteParticipantes?: number;
  }
) {
  const { data } = await axios.patch(
    `${API_URL}/api/programa-voluntariado/${id}`,
    payload,
    {
      headers: { ...authHeader() },
    }
  );

  return data;
}

export async function deleteProgramaVoluntariado(id: string | number) {
  const { data } = await axios.delete(
    `${API_URL}/api/programa-voluntariado/${id}`,
    {
      headers: { ...authHeader() },
    }
  );

  return data ?? { ok: true };
}

/* ===================== 📂 API Programa Voluntariado ===================== */

export async function fetchProgramasVoluntariado(
  params?: Record<string, string | number | boolean>
) {
  const qs = buildQS(params);

  const { data } = await axios.get(
    `${API_URL}/api/programa-voluntariado${qs}`,
    {
      headers: { ...authHeader() },
    }
  );

  return data;
}

export function normalizePrograma(p: any) {
  const asignaciones = Array.isArray(p?.voluntarios) ? p.voluntarios : [];

  const voluntariosAsignados = asignaciones
    .map((a: any) => a?.voluntarioId ?? a?.voluntario?.id ?? null)
    .filter((id: any) => typeof id === "number" || typeof id === "string");

  const asignacionesPorVoluntario: Record<
    string,
    {
      pagoRealizado: boolean;
      origen: OrigenVoluntariado;
      intermediario: string | null;
      fechaEntrada: string | null;
      fechaSalida: string | null;
      horasTotales: number;
      assignedAt: string | null;
    }
  > = {};

  for (const a of asignaciones) {
    const vid = a?.voluntarioId ?? a?.voluntario?.id;
    if (vid === undefined || vid === null) continue;

    asignacionesPorVoluntario[String(vid)] = {
      pagoRealizado: Boolean(a?.pagoRealizado),
      origen: (a?.origen ?? "CUENTA_PROPIA") as OrigenVoluntariado,
      intermediario: a?.intermediario ?? null,
      fechaEntrada: a?.fechaEntrada ? String(a.fechaEntrada) : null,
      fechaSalida: a?.fechaSalida ? String(a.fechaSalida) : null,
      horasTotales: Number(a?.horasTotales ?? 0),
      assignedAt: a?.assignedAt ? String(a.assignedAt) : null,
    };
  }

  return {
    id: p?.id ?? String(p?.id ?? ""),
    nombre: p?.nombre ?? `Programa #${p?.id ?? "?"}`,
    lugar: p?.lugar ?? "N/D",
    descripcion: p?.descripcion ?? "",
    limiteParticipantes: Number(p?.limiteParticipantes ?? 0),
    voluntariosAsignados,
    asignacionesPorVoluntario,
  };
}

/* ===================== 🤝 Asignaciones ===================== */

export async function assignVolunteerToPrograma(
  voluntarioId: string | number,
  programaId: string | number,
  payload: Partial<AsignacionProgramaPayload> & { origen: OrigenVoluntariado }
) {
  const body: AsignacionProgramaPayload = {
    pagoRealizado: payload.pagoRealizado ?? false,
    origen: payload.origen,
    intermediario:
      payload.origen === "INTERMEDIARIO"
        ? (payload.intermediario ?? "").toString()
        : null,
    fechaEntrada: payload.fechaEntrada ?? new Date().toISOString(),
    fechaSalida: payload.fechaSalida ?? null,
    horasTotales: payload.horasTotales ?? 0,
  };

  const { data } = await axios.post(
    `${API_URL}/api/programa-voluntariado/${programaId}/voluntarios/${voluntarioId}`,
    body,
    {
      headers: { ...authHeader() },
    }
  );

  return data ?? { ok: true };
}

export async function updateVolunteerProgramaAssignment(
  voluntarioId: string | number,
  programaId: string | number,
  payload: Partial<AsignacionProgramaPayload>
) {
  const { data } = await axios.patch(
    `${API_URL}/api/programa-voluntariado/${programaId}/voluntarios/${voluntarioId}`,
    payload,
    {
      headers: { ...authHeader() },
    }
  );

  return data ?? { ok: true };
}

export async function unassignVolunteerFromPrograma(
  voluntarioId: string | number,
  programaId: string | number
) {
  const { data } = await axios.delete(
    `${API_URL}/api/programa-voluntariado/${programaId}/voluntarios/${voluntarioId}`,
    {
      headers: { ...authHeader() },
    }
  );

  return data ?? { ok: true };
}