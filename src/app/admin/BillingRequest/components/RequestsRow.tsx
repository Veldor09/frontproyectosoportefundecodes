// src/app/admin/Billing/components/RequestsRow.tsx
'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBillingStatusForSolicitud } from '../services/billing.api';
import {
  describeDestino,
  describeSolicitante,
  formatCRC,
} from '../services/destinos.api';

/**
 * Item recibido por la fila. Acepta los campos enriquecidos que el back
 * ahora incluye (usuario, monto, programa, project, tipoOrigen).
 */
type RowItem = {
  id: number;
  titulo?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  createdAt?: string | null;

  monto?: string | number | null;
  tipoOrigen?: 'PROGRAMA' | 'PROYECTO' | null;
  programa?: { id: number; nombre: string } | null;
  project?: { id: number; title: string } | null;
  usuario?: { id: number; name: string | null; email: string } | null;
};

function statusClasses(estado?: string) {
  const e = (estado ?? '').toUpperCase();
  if (e === 'PAGADA') return 'bg-emerald-100 text-emerald-800';
  if (e === 'APROBADA') return 'bg-green-100 text-green-700';
  if (e === 'RECHAZADA') return 'bg-red-100 text-red-700';
  if (e === 'VALIDADA') return 'bg-blue-100 text-blue-700';
  if (e === 'DEVUELTA') return 'bg-purple-100 text-purple-700';
  if (e === 'PENDIENTE' || e === 'EN_REVISION' || e === 'REVISION')
    return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

type Props = {
  item?: RowItem | null;
  onView?: (id: number) => void;
  /** Si true, oculta la columna "Solicitante" (rol colaboradorsolicitante) */
  hideSolicitante?: boolean;
};

export default function RequestsRow({ item, onView, hideSolicitante = false }: Props) {
  const id = (item?.id ?? null) as number | null;
  const titulo = item?.titulo ?? '—';
  const descripcion = item?.descripcion ?? '—';
  const createdAt = item?.createdAt ?? null;

  // Trae el estado de billing (PAID) para esta solicitud
  const { data: billingStatus } = useQuery({
    queryKey: ['billingStatus', id],
    queryFn: () => getBillingStatusForSolicitud(id as number),
    enabled: id != null,
    staleTime: 60 * 1000,
  });

  // Estado final: si billing dice PAID -> PAGADA, si no usa el estado original
  const estado = useMemo(() => {
    if ((billingStatus ?? '').toUpperCase() === 'PAID') return 'PAGADA';
    return item?.estado ?? 'PENDIENTE';
  }, [billingStatus, item?.estado]);

  const solicitante = describeSolicitante(item ?? {});
  const destino = describeDestino(item ?? {});
  const tipoLabel = item?.tipoOrigen === 'PROGRAMA'
    ? 'Programa'
    : item?.tipoOrigen === 'PROYECTO'
    ? 'Proyecto'
    : '';

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <div
            className="max-w-[18rem] sm:max-w-[24rem] md:max-w-[28rem] truncate font-medium text-slate-800"
            title={titulo}
          >
            {titulo}
          </div>
          <div
            className="max-w-[18rem] sm:max-w-[24rem] md:max-w-[28rem] text-xs text-slate-500 line-clamp-1"
            title={descripcion ?? undefined}
          >
            {descripcion}
          </div>
        </div>
      </td>

      {/* Solicitante — oculto cuando hideSolicitante=true */}
      {!hideSolicitante && (
        <td className="px-4 py-3">
          <div className="text-sm text-slate-800 truncate" title={solicitante}>
            {solicitante}
          </div>
          {item?.usuario?.name && (
            <div className="text-xs text-slate-500 truncate" title={item.usuario.email}>
              {item.usuario.email}
            </div>
          )}
        </td>
      )}

      {/* ✅ Destino: programa o proyecto */}
      <td className="px-4 py-3">
        <div className="text-sm text-slate-800 truncate" title={destino}>
          {destino}
        </div>
        {tipoLabel && (
          <div className="text-xs text-slate-500">{tipoLabel}</div>
        )}
      </td>

      {/* ✅ Monto */}
      <td className="px-4 py-3 text-right tabular-nums">
        {formatCRC(item?.monto)}
      </td>

      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusClasses(estado)}`}>
          {estado}
        </span>
      </td>

      <td className="px-4 py-3">{formatDate(createdAt)}</td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
          onClick={() => (id != null ? onView?.(id) : undefined)}
          disabled={!onView || id == null}
          aria-disabled={!onView || id == null}
        >
          Ver
        </button>
      </td>
    </tr>
  );
}
