// src/app/admin/BillingRequest/types/billing.types.ts

/* =========================
 * Básicos / Enums
 * ========================= */
export type Currency = "CRC" | "USD";

/* =========================
 * Programas (para selects)
 * ========================= */
export interface ProgramOption {
  id: string;
  name: string;
}

/* =========================
 * Payments (DTOs y modelos)
 * ========================= */
export interface CreatePaymentDto {
  /** ID de la solicitud */
  requestId: number;
  /**
   * Opcional. Ya no forzamos "programa".
   * Si el backend puede inferirlo desde la solicitud, puedes omitirlo.
   */
  projectId?: number;
  /** "YYYY-MM-DD" */
  date: string;
  amount: number;
  currency: Currency;
  reference: string;
}

export interface Payment {
  id: string;
  requestId: number;
  projectId?: number;
  amount: number;
  currency: Currency;
  reference: string;
  date: string;
}

/* =========================
 * Ledger (Historial por programa)
 * ========================= */
export type LedgerEvent =
  | {
      type: "BUDGET";
      date: string;
      amount: number;
      meta: { mes: number | null; anio: number | null };
    }
  | {
      type: "ALLOCATION";
      date: string;
      amount: number;
      meta: { concept: string };
    }
  | {
      type: "INVOICE";
      date: string;
      amount: number;
      meta: { number: string; currency: Currency; valid: boolean };
    }
  | {
      type: "PAYMENT";
      date: string;
      amount: number;
      meta: { reference: string; currency: Currency };
    }
  | {
      type: "RECEIPT";
      date: string;
      amount: 0;
      meta: { url: string; mime: string; filename: string; paymentId: string | null };
    };

/* =========================
 * Request (ligero)
 * ========================= */
export interface BillingRequestLite {
  id: number;
  projectId?: number;
  status?: string;
}

/* =========================
 * UI — Payment Form Model
 * ========================= */
export interface PaymentFormModel {
  requestId: number;
  projectId?: number;     // ← opcional
  amount: string;
  currency: Currency;
  date: string;
  reference: string;
  method?: string;
}

/* =========================
 * Helpers
 * ========================= */
export function toNumberSafe(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
