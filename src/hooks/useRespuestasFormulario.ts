"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRespuestasFormulario,
  getRespuestaFormularioById,
  updateEstadoRespuestaFormulario,
  GetRespuestasParams,
  EstadoRespuestaFormulario,
} from "../services/respuestasFormulario.service";

export function useRespuestasFormulario(params: GetRespuestasParams) {
  return useQuery({
    queryKey: ["respuestas-formulario", params],
    queryFn: () => getRespuestasFormulario(params),
  });
}

export function useRespuestaFormulario(id: string, enabled = true) {
  return useQuery({
    queryKey: ["respuesta-formulario", id],
    queryFn: () => getRespuestaFormularioById(id),
    enabled: !!id && enabled,
  });
}

export function useUpdateEstadoRespuestaFormulario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: string;
      estado: EstadoRespuestaFormulario;
    }) => updateEstadoRespuestaFormulario(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["respuestas-formulario"] });
      queryClient.invalidateQueries({
        queryKey: ["respuesta-formulario", variables.id],
      });
    },
  });
}