// src/app/admin/BillingRequest/components/ProgramLedger.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProgramLedger, usePrograms } from "../hooks/useBilling";
import type { LedgerEvent, ProgramOption } from "../types/billing.types";
import ProgramSelect from "./ProgramSelect";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// (Opcional) pequeño filtro por texto dentro de meta/detalle
function matchText(ev: LedgerEvent, q: string) {
  if (!q) return true;
  const s = JSON.stringify(ev.meta ?? {}).toLowerCase();
  return s.includes(q);
}

export default function ProgramLedger() {
  const programsQ = usePrograms();
  const [programId, setProgramId] = useState<string>(""); // select guarda string
  const [search, setSearch] = useState("");

  const projectNum = useMemo(() => {
    const n = Number(programId);
    return Number.isFinite(n) ? n : undefined;
  }, [programId]);

  const ledgerQ = useProgramLedger(projectNum, { enabled: !!projectNum });

  // Autoseleccionar primer programa disponible
  useEffect(() => {
    if (!programsQ.isLoading && Array.isArray(programsQ.data) && programsQ.data.length > 0) {
      setProgramId((prev) => (prev ? prev : programsQ.data![0].id));
    }
  }, [programsQ.isLoading, programsQ.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = Array.isArray(ledgerQ.data) ? ledgerQ.data : [];
    return rows.filter((ev) => matchText(ev, q));
  }, [ledgerQ.data, search]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Historial</h2>
          <p className="text-xs text-slate-500">
            Movimientos del programa: presupuestos, asignaciones, facturas y pagos registrados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar en detalle (número, referencia, concepto…) "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Selector de programa */}
          <div className="w-full sm:w-72">
            <ProgramSelect
              value={programId}
              onChange={setProgramId}
              allowManual
              placeholder={
                programsQ.isLoading
                  ? "Cargando programas…"
                  : programsQ.isError
                  ? "No se pudo cargar la lista de programas"
                  : "Selecciona un programa"
              }
              options={(programsQ.data as ProgramOption[]) ?? []}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {ledgerQ.isLoading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : ledgerQ.isError ? (
        <p className="text-sm text-rose-600">
          No se pudo cargar el historial. Intenta nuevamente.
        </p>
      ) : !projectNum ? (
        <p className="text-sm text-slate-500">Selecciona un programa para ver su historial.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No hay movimientos para este programa.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm border border-slate-200 rounded-lg">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-32">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-32">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Detalle</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-32">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, idx) => {
                const date = new Date(ev.date).toLocaleDateString();
                const type = ev.type;
                // Render amigable del detalle
                let detail = "";
                let amountStr = "";
                if (type === "BUDGET") {
                  detail = `Presupuesto ${ev.meta?.anio ?? ""}/${ev.meta?.mes ?? ""}`;
                  amountStr = `+ ${ev.amount.toLocaleString()}`;
                } else if (type === "ALLOCATION") {
                  detail = `${ev.meta?.concept ?? ""}`;
                  amountStr = `- ${Math.abs(ev.amount).toLocaleString()}`;
                } else if (type === "INVOICE") {
                  const { number, currency, valid } = ev.meta as any;
                  detail = `Factura ${number} (${currency}) ${valid ? "✓" : "✕"}`;
                  amountStr = `- ${Math.abs(ev.amount).toLocaleString()}`;
                } else if (type === "PAYMENT") {
                  const { reference, currency } = ev.meta as any;
                  detail = `Pago ${reference} (${currency})`;
                  amountStr = `- ${Math.abs(ev.amount).toLocaleString()}`;
                } else if (type === "RECEIPT") {
                  const { filename } = ev.meta as any;
                  detail = `Recibo ${filename ?? ""}`;
                  amountStr = "—";
                }

                return (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3">{date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          type === "BUDGET"
                            ? "bg-emerald-100 text-emerald-800"
                            : type === "ALLOCATION"
                            ? "bg-blue-100 text-blue-800"
                            : type === "INVOICE"
                            ? "bg-orange-100 text-orange-800"
                            : type === "PAYMENT"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="truncate" title={detail}>
                        {detail}
                      </div>
                    </td>
                    <td className="px-4 py-3">{amountStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
