// src/app/admin/Billing/components/AccountantRow.tsx
"use client";

import { Button } from "@/components/ui/button";
import { formatCRC } from "../services/destinos.api";

export type AccountantRowReq = {
  id: number | string;
  concept?: string;
  /** Texto a mostrar en la columna "Programa/Proyecto". */
  destino?: string;
  /** Etiqueta corta del tipo: "Programa" o "Proyecto". */
  destinoTipo?: "Programa" | "Proyecto" | "";
  /** Solicitante (nombre o email). */
  solicitante?: string;
  /** Email del solicitante para tooltip/secundario. */
  solicitanteEmail?: string | null;
  /** Monto: number o string (Decimal serializado). */
  amount?: number | string | null;
};

export default function AccountantRow({
  req,
  onValidate,
  onReturnClick,
  onViewClick,
}: {
  req: AccountantRowReq;
  onValidate: () => void;
  onReturnClick: () => void;
  onViewClick: () => void;
}) {
  const concept = req.concept ?? "—";
  const solicitante = req.solicitante ?? "—";
  const destino = req.destino ?? "—";
  const destinoTipo = req.destinoTipo ?? "";
  const monto = formatCRC(req.amount ?? null);

  return (
    <tr className="border-b hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-600">{req.id}</td>
      <td className="px-4 py-3">
        <div className="truncate font-medium text-slate-800" title={concept}>
          {concept}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-800 truncate" title={solicitante}>
          {solicitante}
        </div>
        {req.solicitanteEmail && req.solicitante !== req.solicitanteEmail && (
          <div className="text-xs text-slate-500 truncate" title={req.solicitanteEmail}>
            {req.solicitanteEmail}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-800 truncate" title={destino}>
          {destino}
        </div>
        {destinoTipo && (
          <div className="text-xs text-slate-500">{destinoTipo}</div>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{monto}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="secondary" onClick={onViewClick}>Ver</Button>
          <Button size="sm" onClick={onValidate} className="bg-emerald-600 hover:bg-emerald-700 text-white">Validar</Button>
          <Button size="sm" variant="outline" onClick={onReturnClick}>Devolver</Button>
        </div>
      </td>
    </tr>
  );
}
