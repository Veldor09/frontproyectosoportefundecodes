// src/app/admin/Billing/components/DirectorRow.tsx
"use client";

import { Button } from "@/components/ui/button";
import { formatCRC } from "../services/destinos.api";

export type DirectorRowReq = {
  id: number | string;
  concept?: string;
  destino?: string;
  destinoTipo?: "Programa" | "Proyecto" | "";
  solicitante?: string;
  solicitanteEmail?: string | null;
  amount?: number | string | null;
};

export default function DirectorRow({
  req,
  onApprove,
  onRejectClick,
  onViewClick,
}: {
  req: DirectorRowReq;
  onApprove: () => void;
  onRejectClick: () => void;
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
          <Button size="sm" onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">Aprobar</Button>
          <Button size="sm" variant="destructive" onClick={onRejectClick}>Rechazar</Button>
        </div>
      </td>
    </tr>
  );
}
