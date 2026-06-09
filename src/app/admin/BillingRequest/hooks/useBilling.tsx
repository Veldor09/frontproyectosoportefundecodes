// src/app/admin/BillingRequest/hooks/useBilling.tsx
"use client";

import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import * as api from "../services/billing.api";
import type {
  CreatePaymentDto,
  LedgerEvent,
  Payment,
  ProgramOption,
} from "../types/billing.types";

/* ===== Tipos locales mínimos ===== */
type BillingRequestLite = {
  id: number;
  projectId: number;
  status?: string;
};

/* ===== Opciones simples ===== */
type SimpleQueryOpts = {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
};

/* ===== Programs (para ProgramLedger o selects que usen /programs) ===== */
export function usePrograms(
  opts?: SimpleQueryOpts
): UseQueryResult<ProgramOption[], unknown> {
  return useQuery<ProgramOption[], unknown>({
    queryKey: ["programs"],
    queryFn: api.listPrograms,
    enabled: opts?.enabled ?? true,
    refetchOnWindowFocus: opts?.refetchOnWindowFocus ?? false,
    staleTime: 5 * 60 * 1000,
  });
}

/* ===== Ledger ===== */
export function useProgramLedger(
  projectId?: number | null,
  opts?: SimpleQueryOpts
): UseQueryResult<LedgerEvent[], unknown> {
  return useQuery<LedgerEvent[], unknown>({
    queryKey: ["ledger", projectId ?? null],
    queryFn: () => api.getLedger(Number(projectId)),
    enabled: (opts?.enabled ?? true) && !!projectId,
    refetchOnWindowFocus: opts?.refetchOnWindowFocus ?? false,
  });
}

/* ===== BillingRequest (mínimo para inferir projectId si lo necesitas) ===== */
export function useRequest(
  id?: number | null,
  opts?: SimpleQueryOpts
): UseQueryResult<BillingRequestLite, unknown> {
  return useQuery<BillingRequestLite, unknown>({
    queryKey: ["request", id ?? null],
    queryFn: () => api.getRequest(Number(id)),
    enabled: (opts?.enabled ?? true) && !!id,
    refetchOnWindowFocus: opts?.refetchOnWindowFocus ?? false,
  });
}

/* ===== Payments ===== */
export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreatePaymentDto): Promise<Payment> =>
      api.createPayment(dto),
    onSuccess: (_payment, dto) => {
      // ✅ Invalida el estado derivado de Billing para esa solicitud
      if (dto?.requestId) {
        qc.invalidateQueries({ queryKey: ["billingStatus", dto.requestId] });
      }
      // Si tienes listas con solicitudes cacheadas, puedes invalidarlas también:
      qc.invalidateQueries({ queryKey: ["requests"] });     // si usas react-query para solicitudes
      qc.invalidateQueries({ queryKey: ["history"] });      // si tu historial está cacheado
      if (dto?.projectId) {
        qc.invalidateQueries({ queryKey: ["ledger", dto.projectId] });
      }
    },
  });
}

/* ===== Util error ===== */
export const formatApiError = api.formatApiError;
