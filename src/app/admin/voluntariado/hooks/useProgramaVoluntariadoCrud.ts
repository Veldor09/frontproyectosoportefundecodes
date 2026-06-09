"use client";

import useSWR from "swr";
import {
  fetchProgramasVoluntariado,
  createProgramaVoluntariado,
  updateProgramaVoluntariado,
  deleteProgramaVoluntariado,
} from "../services/programaVoluntariadoService";

export function useProgramaVoluntariadoCrud() {
  const { data, error, isLoading, mutate } = useSWR(
    ["programa-voluntariado:crud:list"],
    async () => {
      const raw = await fetchProgramasVoluntariado();
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
        ? (raw as any).data
        : [];
      return arr;
    },
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  async function create(payload: {
    nombre: string;
    lugar: string;
    descripcion?: string;
    limiteParticipantes?: number;
    imagenUrl?: string;
    imagenKey?: string;
  }) {
    await createProgramaVoluntariado(payload);
    await mutate(undefined, { revalidate: true });
  }

  async function update(
    id: string | number,
    payload: {
      nombre?: string;
      lugar?: string;
      descripcion?: string;
      limiteParticipantes?: number;
      imagenUrl?: string;
      imagenKey?: string;
    }
  ) {
    await updateProgramaVoluntariado(id, payload);
    await mutate(undefined, { revalidate: true });
  }

  async function remove(id: string | number) {
    await deleteProgramaVoluntariado(id);
    await mutate(undefined, { revalidate: true });
  }

  return {
    data: data ?? [],
    loading: isLoading,
    error,
    create,
    update,
    remove,
    refetch: () => mutate(undefined, { revalidate: true }),
  };
}