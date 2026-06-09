"use client";

import axios from "axios"; // para axios.isAxiosError
import axiosInstance from "./axiosInstance";
import type {
  CreatePaymentDto,
  LedgerEvent,
  Payment,
  ProgramOption,
} from "../types/billing.types";
import { getSolicitud } from "../services/solicitudes.api";

/* ===========================================================
   🔧 CONFIG GENERAL
=========================================================== */

export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    "http://localhost:4000/api/") as string;

/** Headers automáticos con token localStorage si existe */
function authHeader() {
  const t =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ====================== Helpers base ====================== */
async function assertOkAxios<T>(promise: Promise<{ data: T }>): Promise<T> {
  try {
    const res = await promise;
    return res.data;
  } catch (err: any) {
    let msg: string;
    if (axios.isAxiosError(err)) {
      msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error desconocido";
    } else {
      msg = String(err);
    }
    const e: any = new Error(msg);
    e.status = err?.response?.status;
    throw e;
  }
}

export function formatApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/* ===========================================================
   📘 PROGRAMAS (para selects o ledger)
=========================================================== */
export async function listPrograms(): Promise<ProgramOption[]> {
  const rows = await assertOkAxios<any[]>(
    axiosInstance.get(`${API_URL}/api/programs`, {
      headers: { ...authHeader() },
      withCredentials: true,
    })
  );
  return (rows ?? []).map((r: any) => ({ id: String(r.id), name: r.title }));
}

/* ===========================================================
   💳 PAGOS
=========================================================== */

/** POST /api/billing/payments */
export async function createPayment(dto: CreatePaymentDto): Promise<Payment> {
  return assertOkAxios(
    axiosInstance.post(`${API_URL}/api/billing/payments`, dto, {
      headers: { "Content-Type": "application/json", ...authHeader() },
      withCredentials: true,
    })
  );
}

/** GET /api/billing/payments?requestId=ID */
export async function listPaymentsForRequest(
  requestId: number
): Promise<Payment[]> {
  return assertOkAxios(
    axiosInstance.get(`${API_URL}/api/billing/payments`, {
      params: { requestId },
      headers: { ...authHeader() },
      withCredentials: true,
    })
  );
}

/** GET /api/billing/payments?projectId=ID */
export async function listPaymentsForProject(
  projectId: number
): Promise<Payment[]> {
  return assertOkAxios(
    axiosInstance.get(`${API_URL}/api/billing/payments`, {
      params: { projectId },
      headers: { ...authHeader() },
      withCredentials: true,
    })
  );
}

/* ===========================================================
   🧾 COMPROBANTE DE PAGO
=========================================================== */

/** POST /api/billing/payments/:paymentId/comprobante
 *  Sube un comprobante de pago (PDF o imagen) a Cloudflare R2.
 */
export async function uploadComprobante(
  paymentId: string,
  file: File
): Promise<{ comprobanteUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data } = await axiosInstance.post(
    `${API_URL}/api/billing/payments/${paymentId}/comprobante`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
    }
  );
  return data;
}

/** DELETE /api/billing/payments/:paymentId/comprobante */
export async function deleteComprobante(paymentId: string): Promise<void> {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  await axiosInstance.delete(
    `${API_URL}/api/billing/payments/${paymentId}/comprobante`,
    {
      headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    }
  );
}

/* ===========================================================
   📊 LEDGER
=========================================================== */
export async function getLedger(projectId: number): Promise<LedgerEvent[]> {
  return assertOkAxios(
    axiosInstance.get(`${API_URL}/api/billing/programs/${projectId}/ledger`, {
      headers: { ...authHeader() },
      withCredentials: true,
    })
  );
}

/* ===========================================================
   🧾 BILLING REQUEST (usa el módulo Solicitudes real)
=========================================================== */

/** GET /api/solicitudes/:id */
export async function getRequest(id: number) {
  return assertOkAxios<any>(
    axiosInstance.get(`${API_URL}/api/solicitudes/${id}`, {
      headers: { ...authHeader() },
      withCredentials: true,
    })
  );
}

/* ===========================================================
   🧩 Crear BillingRequest si NO existe (usa Solicitud real)
=========================================================== */
type EnsureArgs = {
  solicitudId: number;
  /**
   * Opcional: solo se envía cuando la solicitud original era de tipo
   * PROYECTO. Para solicitudes PROGRAMA el back deriva el projectId
   * automáticamente desde la solicitud (toma el primero como contenedor).
   */
  projectId?: number;
  fallbackAmount?: number;
};

type CreateBillingRequestBody = {
  amount: number;
  concept: string;
  projectId: number;
  createdBy?: string;
  draftInvoiceUrl?: string;
  history?: unknown[];
};

/** POST /api/solicitudes — crea nueva solicitud si no existe */
async function createBillingRequest(body: CreateBillingRequestBody) {
  return assertOkAxios<any>(
    axiosInstance.post(`${API_URL}/api/solicitudes`, body, {
      headers: { "Content-Type": "application/json", ...authHeader() },
      withCredentials: true,
    })
  );
}

/**
 * Asegura que exista un BillingRequest con id == solicitudId.
 * - Si ya existe la solicitud, la retorna.
 * - Si no existe, la crea usando datos básicos.
 */
export async function ensureBillingRequestFromSolicitud(args: EnsureArgs) {
  const { solicitudId } = args;

  // ✅ Llamada al nuevo endpoint puente
  return assertOkAxios(
    axiosInstance.post(
      `${API_URL}/api/billing/request-from-solicitud/${solicitudId}`,
      {},
      {
        headers: { ...authHeader() },
        withCredentials: true,
      }
    )
  );
}

/* ===========================================================
   💬 Estado Billing de una Solicitud
   Determina si ya tiene pagos registrados → "PAID" | null
=========================================================== */
export async function getBillingStatusForSolicitud(
  id: number
): Promise<string | null> {
  try {
    const payments = await listPaymentsForRequest(id);
    return Array.isArray(payments) && payments.length > 0 ? "PAID" : null;
  } catch {
    return null;
  }
}
