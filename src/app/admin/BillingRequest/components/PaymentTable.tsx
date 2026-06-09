// src/app/admin/BillingRequest/components/PaymentTable.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PaymentForm from "./PaymentForm";
import {
  fetchSolicitudes,
  type SolicitudListItem,
} from "../services/solicitudes.api";
import { getBillingStatusForSolicitud, uploadComprobante } from "../services/billing.api";
import { toast } from "sonner";

/** Deriva el estado visual combinando Contadora/Dirección y Billing (PAID). */
function computeDisplayStatus(
  it: Pick<SolicitudListItem, "estadoContadora" | "estadoDirector">,
  billingStatus?: string | null
) {
  if ((billingStatus ?? "").toUpperCase() === "PAID") return "PAGADA";
  const ed = (it.estadoDirector ?? "PENDIENTE").toString().toUpperCase();
  const ec = (it.estadoContadora ?? "PENDIENTE").toString().toUpperCase();
  if (ed === "APROBADA" || ed === "RECHAZADA") return ed;
  return ec || "PENDIENTE";
}

function describeSolicitante(it: SolicitudListItem): string {
  const u = (it as any).usuario;
  if (!u) return "—";
  return u.name?.trim() || u.email || "—";
}

function describeArea(it: SolicitudListItem): string {
  return (it as any).areaOrg?.nombre ?? "—";
}

export default function PaymentTable() {
  const [items, setItems] = useState<SolicitudListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("");

  // Mapa de estados del Billing (PAID, etc.) por id de solicitud
  const [bStatusMap, setBStatusMap] = useState<Record<number, string | null>>({});

  // Modal
  const [open, setOpen] = useState(false);
  const [ctxId, setCtxId] = useState<number | null>(null);
  // Comprobante — después de registrar el pago
  const [paidPaymentId, setPaidPaymentId] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [uploadingComp, setUploadingComp] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSolicitudes();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Opciones de área únicas (para el filtro)
  const areaOptions = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((it) => {
      const nombre = (it as any).areaOrg?.nombre;
      if (nombre) seen.add(nombre);
    });
    return Array.from(seen).sort();
  }, [items]);

  // Filtro por búsqueda (título, descripción, solicitante)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const t = (it as any)?.titulo?.toLowerCase?.() ?? "";
      const d = (it as any)?.descripcion?.toLowerCase?.() ?? "";
      const sol = describeSolicitante(it).toLowerCase();
      return t.includes(q) || d.includes(q) || sol.includes(q);
    });
  }, [items, search]);

  // IDs candidatos visibles
  const candidateIds = useMemo(() => filtered.map((r) => r.id), [filtered]);

  // Prefetch de billingStatus para todos los IDs candidatos
  useEffect(() => {
    let mounted = true;
    (async () => {
      const next = { ...bStatusMap };
      const missing = candidateIds.filter((id) => typeof next[id] === "undefined");
      if (missing.length === 0) return;

      await Promise.allSettled(
        missing.map(async (id) => {
          const st = await getBillingStatusForSolicitud(id);
          next[id] = st ?? null;
        })
      );

      if (mounted) setBStatusMap(next);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateIds]);

  // ¿Ya conocemos el billingStatus de todos los candidatos?
  const allKnown = candidateIds.every((id) => typeof bStatusMap[id] !== "undefined");

  // Pendientes de pago = solo las APROBADAS por el director y NO PAGADAS
  const visible = useMemo(() => {
    if (!allKnown) return [];
    return filtered.filter((r) => {
      const st = computeDisplayStatus(r, bStatusMap[r.id]);
      if (st !== "APROBADA") return false;
      if (areaFilter) {
        const area = (r as any).areaOrg?.nombre ?? "";
        if (area !== areaFilter) return false;
      }
      return true;
    });
  }, [filtered, bStatusMap, allKnown, areaFilter]);

  // Eliminación inmediata tras pagar (sin reload)
  function removeRowInstant(id: number) {
    setBStatusMap((m) => ({ ...m, [id]: "PAID" }));
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function closeModal() {
    setOpen(false);
    setCtxId(null);
    setPaidPaymentId(null);
    setComprobante(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
      {/* Encabezado y controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pendientes de pago</h2>
          <p className="text-xs text-slate-500">
            Solicitudes con <span className="font-semibold">aprobación de dirección</span> pendientes de pago.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 w-full sm:w-64"
              placeholder="Buscar por título, descripción o solicitante"
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

      {loading || !allKnown ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500">
          {areaFilter
            ? `No hay solicitudes aprobadas por dirección pendientes de pago en el área "${areaFilter}".`
            : "No hay solicitudes aprobadas por dirección pendientes de pago."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-lg">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-16">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-36">Área</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-40">Solicitante</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-28">Monto</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-28">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const estado = computeDisplayStatus(r, bStatusMap[r.id]);
                const monto = r.monto !== null && r.monto !== undefined && r.monto !== ""
                  ? Number(r.monto).toLocaleString("es-CR")
                  : "—";
                return (
                  <tr key={r.id} className="border-t hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="line-clamp-2" title={String((r as any)?.titulo ?? "")}>
                        {(r as any)?.titulo ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{describeArea(r)}</td>
                    <td className="px-4 py-3 text-slate-600 break-words">{describeSolicitante(r)}</td>
                    <td className="px-4 py-3 tabular-nums">₡{monto}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                          ${
                            estado === "PAGADA"
                              ? "bg-emerald-100 text-emerald-800"
                              : estado === "APROBADA"
                              ? "bg-emerald-50 text-emerald-700"
                              : estado === "VALIDADA"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold"
                        onClick={() => {
                          setCtxId(r.id);
                          setOpen(true);
                        }}
                      >
                        Añadir pago
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de pago */}
      {open && ctxId != null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Registrar pago</h3>
              <button
                onClick={closeModal}
                className="text-sm text-gray-600 hover:text-black"
              >
                Cerrar
              </button>
            </div>
            <div className="p-6">
              {paidPaymentId ? (
                /* ─ Paso 2: Comprobante opcional ─ */
                <div className="space-y-4">
                  <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    ✅ Pago registrado correctamente.
                  </div>
                  <p className="text-sm text-slate-600">
                    Puede adjuntar un comprobante de pago (PDF o imagen). Este paso es opcional.
                  </p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-blue-300 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={uploadingComp}
                      onClick={async () => {
                        if (!comprobante) {
                          closeModal();
                          return;
                        }
                        setUploadingComp(true);
                        try {
                          await uploadComprobante(paidPaymentId, comprobante);
                          toast.success("Comprobante subido correctamente");
                        } catch {
                          toast.error("No se pudo subir el comprobante");
                        } finally {
                          setUploadingComp(false);
                          closeModal();
                        }
                      }}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploadingComp ? "Subiendo…" : comprobante ? "Subir comprobante" : "Omitir"}
                    </button>
                  </div>
                </div>
              ) : (
                <PaymentForm
                  requestId={ctxId}
                  defaultCurrency="CRC"
                  onPaid={(paymentId) => {
                    removeRowInstant(ctxId);
                    setPaidPaymentId(paymentId);
                    toast.success("Pago registrado");
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
