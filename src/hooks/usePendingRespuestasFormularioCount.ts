"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  getPendingRespuestasFormularioCount,
  type PendingRespuestasFormularioCount,
} from "../services/respuestasFormulario.service";

export function usePendingRespuestasFormularioCount(): UseQueryResult<
  PendingRespuestasFormularioCount,
  Error
> {
  return useQuery<PendingRespuestasFormularioCount, Error>({
    queryKey: ["pending-respuestas-formulario-count"],
    queryFn: getPendingRespuestasFormularioCount,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}