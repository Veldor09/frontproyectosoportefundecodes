// src/hooks/useSanciones.ts
"use client";

import useSWR from "swr";
import {
  listSanciones,
  createSancion,
  updateSancion,
  deleteSancion,
  revocarSancion,
  getSancionesActivasPorVoluntario, // <-- nombre correcto
} from "../services/sancionService";
import type { Sancion, SancionCreateDTO, SancionUpdateDTO } from "../types/sancion";

type EstadoFiltroApi = "ACTIVA" | "EXPIRADA" | "REVOCADA" | undefined;

export function useSanciones(
  page = 1,
  search = "",
  estado?: EstadoFiltroApi,
  voluntarioId?: number
) {
  const key = ["sanciones", page, search, estado, voluntarioId] as const;

  const { data, isLoading, mutate, error } = useSWR(key, async () => {
    const res = await listSanciones({ page, limit: 10, search, estado, voluntarioId });
    return {
      data: Array.isArray(res.data) ? (res.data as Sancion[]) : [],
      total: typeof res.total === "number" ? res.total : (res.data?.length ?? 0),
    };
  });

  // Crear / actualizar
  async function save(input: Omit<Sancion, "id"> & { id?: number }) {
    if (input.id) {
      // OJO: no envíes null en strings con ValidationPipe; omite campos no cambiados
      const payload: SancionUpdateDTO & { id: number } = {
        id: input.id,
        tipo: input.tipo,
        motivo: input.motivo,
        // Si quieres actualizar descripción, envíala como string; si no, omítela
        ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
        fechaInicio: input.fechaInicio,
        // Si es permanente, **omitir** el campo para que el back lo trate como null
        ...(typeof input.fechaVencimiento === "string"
          ? { fechaVencimiento: input.fechaVencimiento }
          : {}),
        ...(input.creadaPor ? { creadaPor: input.creadaPor } : {}),
      };
      await updateSancion(payload);
    } else {
      const body: SancionCreateDTO = {
        voluntarioId: input.voluntarioId,
        tipo: input.tipo,
        motivo: input.motivo,
        // No mandes null: si no hay descripcion, OMITIR
        ...(input.descripcion ? { descripcion: input.descripcion } : {}),
        fechaInicio: input.fechaInicio,
        // Permanente => OMITIR fechaVencimiento para que el back ponga null
        ...(typeof input.fechaVencimiento === "string"
          ? { fechaVencimiento: input.fechaVencimiento }
          : {}),
        ...(input.creadaPor ? { creadaPor: input.creadaPor } : {}),
      };
      await createSancion(body);
    }
    await mutate();
  }

  async function revocar(id: number, revocadaPor?: string) {
    await revocarSancion(id, revocadaPor);
    await mutate();
  }

  async function remove(id: number) {
    await deleteSancion(id);
    await mutate();
  }

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    save,
    revocar,
    remove,
    refetch: mutate,
  };
}

// Hook específico: sanciones activas por voluntario
export function useSancionesActivasVoluntario(voluntarioId: number) {
  const key = voluntarioId ? ["sanciones-activas", voluntarioId] : null;

  const { data, isLoading, mutate, error } = useSWR(
    key,
    () => getSancionesActivasPorVoluntario(voluntarioId) // <-- nombre correcto
  );

  return {
    data: data ?? [],
    loading: isLoading,
    error,
    refetch: mutate,
  };
}
