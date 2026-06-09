// src/app/admin/Billing/components/AccountantValidationTable.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AccountantRow from "./AccountantRow";
import TextPromptModal from "./TextPromptModal";
import RequestViewModal from "./RequestViewModal";
import {
  fetchSolicitudes,
  validateSolicitud,
  returnSolicitud,
  type SolicitudListItem,
} from "../services/solicitudes.api";
import { describeDestino, describeSolicitante, formatCRC } from "../services/destinos.api";

function LocalAlert({
  kind,
  text,
  onClose,
}: {
  kind: "success" | "error";
  text: string;
  onClose: () => void;
}) {
  const base = "flex items-start gap-2 rounded-md border px-3 py-2 text-sm";
  const styles =
    kind === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-red-50 border-red-200 text-red-800";
  return (
    <div className={`${base} ${styles}`}>
      <div className="font-medium">{kind === "success" ? "Éxito" : "Error"}</div>
      <div className="flex-1">{text}</div>
      <button className="opacity-70 hover:opacity-100" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

const normalize = (s?: string | null) => (s ?? "").toString().trim().toUpperCase();

export default function AccountantValidationTable() {
  const ACCOUNTANT_STATES = new Set(["PENDIENTE"]); // solo pendientes

  const RETURN_MIN = 5;
  const RETURN_MAX = 300;

  const [items, setItems] = useState<SolicitudListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("");

  // modal devolución
  const [showReturn, setShowReturn] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  // modal detalle
  const [openView, setOpenView] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const openReturn = (id: number) => { setTargetId(id); setShowReturn(true); };
  const closeReturn = () => { setShowReturn(false); setTargetId(null); };

  const openDetails = (id: number) => { setViewId(id); setOpenView(true); };
  const closeDetails = () => { setOpenView(false); setViewId(null); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSolicitudes({ estado: "PENDIENTE" });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setAlert({ kind: "error", text: e instanceof Error ? e.message : "No se pudo cargar." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const areaOptions = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((it) => {
      const nombre = (it as any).areaOrg?.nombre;
      if (nombre) seen.add(nombre);
    });
    return Array.from(seen).sort();
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((r) => ACCOUNTANT_STATES.has(normalize((r as any).estadoContadora)))
      .filter((r) => areaFilter ? ((r as any).areaOrg?.nombre ?? "") === areaFilter : true)
      .filter((r) =>
        q ? [r.titulo, r.descripcion].some((t) => (t ?? "").toLowerCase().includes(q)) : true
      );
  }, [items, search, areaFilter]);

  const handleValidate = async (id: number) => {
    try {
      await validateSolicitud(id);
    } finally {
      await load(); // desaparece de la bandeja
      setAlert({ kind: "success", text: "Solicitud validada. Pasó a Dirección." });
    }
  };

  const handleReturnSubmit = async (note: string) => {
    if (targetId == null) return;
    try {
      await returnSolicitud(targetId, note); // -> DEVUELTA
    } finally {
      await load(); // desaparece de la bandeja
      setShowReturn(false);
      setTargetId(null);
      setAlert({ kind: "success", text: "Solicitud devuelta con justificación." });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
      {alert && <LocalAlert {...alert} onClose={() => setAlert(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Validación de Solicitudes</h2>
          <p className="text-xs text-slate-500">
            Bandeja de contabilidad — solo solicitudes <span className="font-semibold">PENDIENTE</span>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 w-full sm:w-64"
              placeholder="Buscar por título o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500">No hay solicitudes pendientes.</p>
      ) : (
        <>
          {/* MOBILE: tarjetas */}
          <div className="md:hidden space-y-3">
            {visible.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 line-clamp-2">{r.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">#{r.id}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums">
                    {formatCRC(r.monto ?? null)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p><span className="font-medium">Solicitante:</span> {describeSolicitante(r)}</p>
                  <p><span className="font-medium">Destino:</span> {describeDestino(r)}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200">
                  <button onClick={() => openDetails(r.id)} className="flex-1 rounded-md py-2 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">Ver</button>
                  <button onClick={() => handleValidate(r.id)} className="flex-1 rounded-md py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">Validar</button>
                  <button onClick={() => openReturn(r.id)} className="flex-1 rounded-md py-2 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors">Devolver</button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full table-fixed text-sm border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 w-16">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 w-44">Solicitante</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 w-44">Destino</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 w-32">Monto</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 w-56">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <AccountantRow
                    key={r.id}
                    req={{
                      id: r.id,
                      concept: r.titulo,
                      solicitante: describeSolicitante(r),
                      solicitanteEmail: r.usuario?.email ?? null,
                      destino: describeDestino(r),
                      destinoTipo: r.tipoOrigen === "PROGRAMA" ? "Programa" : r.tipoOrigen === "PROYECTO" ? "Proyecto" : "",
                      amount: r.monto ?? null,
                    }}
                    onValidate={() => handleValidate(r.id)}
                    onReturnClick={() => openReturn(r.id)}
                    onViewClick={() => openDetails(r.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de justificación: devolver (CONTADORA => DEVUELTA) */}
      <TextPromptModal
        open={showReturn}
        title="Devolver solicitud"
        label="Escribe la justificación de la devolución"
        placeholder="Ej. Falta documento de soporte, monto no coincide, etc."
        minLen={RETURN_MIN}
        maxLen={RETURN_MAX}
        submitText="Devolver"
        onSubmit={handleReturnSubmit}
        onClose={closeReturn}
      />

      {/* Modal de detalle (ver adjuntos, motivo, etc.) */}
      {openView && viewId != null && (
        <RequestViewModal open={openView} solicitudId={viewId} onClose={closeDetails} />
      )}
    </div>
  );
}
