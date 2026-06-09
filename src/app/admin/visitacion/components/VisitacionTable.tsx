"use client";

import { useState } from "react";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import type { Visitacion } from "../types/visitacion";

interface Props {
  items: Visitacion[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (q: string) => void;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  onEdit: (item: Visitacion) => void;
  onDelete: (item: Visitacion) => void;
}

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function fmt(d: string | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function VisitacionTable({
  items, total, page, totalPages, loading, error,
  search, onSearchChange, onPageChange, onRefresh,
  onEdit, onDelete,
}: Props) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function handleDeleteClick(item: Visitacion) {
    setConfirmId(item.id);
  }

  function handleConfirmDelete(item: Visitacion) {
    setConfirmId(null);
    onDelete(item);
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda + recarga */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por fecha o notas…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Nacionales</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">%</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Extranjeros</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">%</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Notas</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2" />
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No hay registros de visitación.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const ext = Math.max(0, item.totalPersonas - item.nacionales);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {fmt(item.fecha)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {item.totalPersonas.toLocaleString("es-CR")}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.nacionales.toLocaleString("es-CR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-sky-100 text-sky-700 text-xs px-2 py-0.5 font-medium">
                        {pct(item.nacionales, item.totalPersonas)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {ext.toLocaleString("es-CR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-medium">
                        {pct(ext, item.totalPersonas)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                      {item.notas || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {confirmId === item.id ? (
                          <>
                            <span className="text-xs text-red-600 mr-1">¿Eliminar?</span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(item)}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 transition-colors"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {total} registro{total !== 1 ? "s" : ""} en total
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span className="px-3 py-1.5 text-xs">
              Página {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
