// src/app/admin/Billing/components/RequestsTable.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchSolicitudes, type SolicitudListItem } from '../services/solicitudes.api';
import RequestsRow from './RequestsRow';
import RequestFormModal from './RequestFormModal';
import RequestViewModal from './RequestViewModal';
import { useSolicitanteRole } from '../hooks/useSolicitanteRole';

function getEstadoDisplay(it: Pick<SolicitudListItem, 'estadoContadora' | 'estadoDirector'>) {
  const ed = (it.estadoDirector ?? 'PENDIENTE').toString().toUpperCase();
  const ec = (it.estadoContadora ?? 'PENDIENTE').toString().toUpperCase();
  if (ed === 'APROBADA' || ed === 'RECHAZADA') return ed;
  return ec || 'PENDIENTE';
}

export default function RequestsTable() {
  const { isSolicitante, userEmail, userId } = useSolicitanteRole();

  const [items, setItems] = useState<SolicitudListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDIENTE' | 'VALIDADA' | 'DEVUELTA' | 'APROBADA' | 'RECHAZADA'
  >('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchSolicitudes();
      const clean = Array.isArray(data)
        ? data.filter((x): x is SolicitudListItem => !!x && typeof (x as any).id !== 'undefined')
        : [];
      setItems(clean);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const areaOptions = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((it) => {
      const nombre = (it as any).areaOrg?.nombre;
      if (nombre) seen.add(nombre);
    });
    return Array.from(seen).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = items.filter((x): x is SolicitudListItem => !!x && typeof (x as any).id !== 'undefined');

    // ── Si es solicitante, mostrar SOLO sus propias solicitudes ──
    if (isSolicitante) {
      base = base.filter((it) => {
        if (userEmail && it.usuario?.email === userEmail) return true;
        if (userId != null && (it as any).usuarioId === userId) return true;
        return false;
      });
    }

    // 1) filtro por estado
    const byStatus = statusFilter === 'ALL'
      ? base
      : base.filter((it) => getEstadoDisplay(it) === statusFilter);

    // 2) filtro por área (solo visible para admins, pero no afecta si está activo)
    const byArea = areaFilter
      ? byStatus.filter((it) => ((it as any).areaOrg?.nombre ?? '') === areaFilter)
      : byStatus;

    // 3) filtro por texto
    if (!q) return byArea;
    return byArea.filter((it) => {
      const t = (it as any)?.titulo?.toLowerCase?.() ?? '';
      const d = (it as any)?.descripcion?.toLowerCase?.() ?? '';
      const e = getEstadoDisplay(it).toLowerCase();
      return t.includes(q) || d.includes(q) || e.includes(q);
    });
  }, [items, search, statusFilter, areaFilter, isSolicitante, userEmail, userId]);

  const handleView = (id: number) => {
    setSelectedId(id);
    setOpenView(true);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 sm:max-w-xs"
            placeholder="Buscar por título, descripción, estado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Estado */}
          <select
            className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 sm:w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value.toUpperCase() as typeof statusFilter)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="VALIDADA">Validada</option>
            <option value="DEVUELTA">Devuelta</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>

          {/* Área — solo admin */}
          {!isSolicitante && (
            <select
              className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 sm:w-44"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">Todas las áreas</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 whitespace-nowrap"
        >
          Nueva solicitud
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full table-fixed border-collapse text-sm">
          <thead className="bg-slate-50 text-left">
            <tr className="text-slate-700">
              <th className="px-4 py-3">Título</th>
              {!isSolicitante && <th className="px-4 py-3 w-44">Solicitante</th>}
              <th className="px-4 py-3 w-44">Destino</th>
              <th className="px-4 py-3 w-32 text-right">Monto</th>
              <th className="px-4 py-3 w-28">Estado</th>
              <th className="px-4 py-3 w-40">Creada</th>
              <th className="px-4 py-3 w-24 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={isSolicitante ? 6 : 7}>
                  Cargando…
                </td>
              </tr>
            ) : errorMsg ? (
              <tr>
                <td className="px-4 py-6 text-center text-red-600" colSpan={isSolicitante ? 6 : 7}>
                  {errorMsg}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={isSolicitante ? 6 : 7}>
                  {isSolicitante ? 'No tienes solicitudes creadas todavía.' : 'No hay solicitudes'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const estado = getEstadoDisplay(item);
                const createdAt = (item as any)?.createdAt ?? null;
                const extended = { ...item, estado, createdAt };
                return (
                  <RequestsRow
                    key={(item as any).id}
                    item={extended as any}
                    onView={handleView}
                    hideSolicitante={isSolicitante}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de creación */}
      {openCreate && (
        <RequestFormModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSaved={() => load()}
        />
      )}

      {/* Modal de detalle */}
      {openView && selectedId != null && (
        <RequestViewModal
          open={openView}
          solicitudId={selectedId}
          onClose={() => setOpenView(false)}
        />
      )}
    </div>
  );
}
