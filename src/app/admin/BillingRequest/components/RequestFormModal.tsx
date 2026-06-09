'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import FileUpload from './FileUpload';
import { useCreateSolicitud } from '../hooks/useCreateSolicitud';
import type { CreateSolicitudPayload } from '../services/solicitudes.api';
import {
  fetchAreasParaSelector,
  fetchSaldoArea,
  fetchMiColaborador,
  type AreaOpcion,
  type SaldoDestino,
} from '../services/destinos.api';
import { getToken, getJwtPayload } from '@/lib/auth';

type Props = { open: boolean; onClose: () => void; onSaved?: () => void };

// límites
const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESC_MIN = 10;
const DESC_MAX = 1000;

// archivos
const FILE_MAX_MB = 25;
const TOTAL_MAX_MB = 100;
const MAX_FILES = 10;

/** Roles considerados "externos" — no pueden ver saldo ni seleccionar área libremente. */
const EXTERNAL_ROLES = ['colaboradorsolicitante', 'colaboradorvoluntariadoexterno'];

export default function RequestFormModal({ open, onClose, onSaved }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [montoStr, setMontoStr] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Catálogos
  const [areas, setAreas] = useState<AreaOpcion[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [saldo, setSaldo] = useState<SaldoDestino | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  // Área fija del colaborador externo
  const [miArea, setMiArea] = useState<{ id: number; nombre: string } | null>(null);
  const [loadingMiArea, setLoadingMiArea] = useState(false);

  // Detectar rol del usuario
  const jwtPayload = useMemo(() => {
    const token = getToken();
    return getJwtPayload<{ sub?: number; roles?: string[] }>(token);
  }, []);
  const userRoles: string[] = jwtPayload?.roles ?? [];
  const esExterno = userRoles.some((r) => EXTERNAL_ROLES.includes(r));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Carga catálogos al abrir
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    if (esExterno) {
      // Colaborador externo: cargamos SU área automáticamente
      setLoadingMiArea(true);
      fetchMiColaborador()
        .then((col) => {
          if (cancelled) return;
          if (col?.areaOrg) {
            setMiArea(col.areaOrg);
            setAreaId(col.areaOrg.id);
          } else {
            setMiArea(null);
          }
        })
        .catch(() => { if (!cancelled) setMiArea(null); })
        .finally(() => { if (!cancelled) setLoadingMiArea(false); });
    } else {
      // Admin/interno: cargamos todas las áreas activas
      setLoadingAreas(true);
      fetchAreasParaSelector()
        .then((list) => { if (!cancelled) setAreas(list); })
        .catch(() => { if (!cancelled) setAreas([]); })
        .finally(() => { if (!cancelled) setLoadingAreas(false); });
    }

    return () => { cancelled = true; };
  }, [open, esExterno]);

  // Carga el saldo cuando se selecciona un área (solo para no-externos)
  useEffect(() => {
    if (esExterno || !areaId) { setSaldo(null); return; }
    let cancelled = false;
    setLoadingSaldo(true);
    fetchSaldoArea(Number(areaId))
      .then((s) => { if (!cancelled) setSaldo(s); })
      .catch(() => { if (!cancelled) setSaldo(null); })
      .finally(() => { if (!cancelled) setLoadingSaldo(false); });
    return () => { cancelled = true; };
  }, [areaId, esExterno]);

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setMontoStr('');
    setAreaId('');
    setFiles([]);
    setSubmitError(null);
    setTriedSubmit(false);
    setSaldo(null);
    if (!esExterno) setMiArea(null);
  };

  const { create, loading, error } = useCreateSolicitud({
    onSuccess: () => {
      resetForm();
      onSaved?.();
      onClose();
    },
    onError: (e) => {
      console.error(e);
    },
  });

  // Monto numérico parseado
  const monto = useMemo(() => {
    const n = Number(montoStr.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }, [montoStr]);

  const titleLen = titulo.length;
  const descLen = descripcion.length;
  const titleInvalid = titleLen < TITLE_MIN || titleLen > TITLE_MAX;
  const descInvalid = descLen < DESC_MIN || descLen > DESC_MAX;
  const montoInvalid = !Number.isFinite(monto) || monto <= 0;
  const areaInvalid = !areaId;
  const filesInvalid = files.length === 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTriedSubmit(true);
    setSubmitError(null);

    if (titleInvalid || descInvalid || montoInvalid || areaInvalid || filesInvalid) {
      if (filesInvalid) setSubmitError('Debes adjuntar al menos un documento o imagen.');
      return;
    }

    const payload: CreateSolicitudPayload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      monto,
      areaId: Number(areaId),
      files,
    };
    await create(payload);
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const errorText =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : null;

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Nueva solicitud</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1 space-y-4">
            {/* Título */}
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                className="w-full rounded-md border p-2 outline-none ring-blue-500 focus:ring-2"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value.slice(0, TITLE_MAX + 1))}
                placeholder="Ej. Compra de insumos"
                disabled={loading}
                required
                maxLength={TITLE_MAX}
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={triedSubmit && titleInvalid ? 'text-red-600' : 'text-slate-500'}>
                  Mínimo {TITLE_MIN}, máximo {TITLE_MAX}.
                </span>
                <span className={triedSubmit && titleInvalid ? 'text-red-600' : 'text-slate-500'}>
                  {titleLen}/{TITLE_MAX}
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <textarea
                className="w-full rounded-md border p-2 outline-none ring-blue-500 focus:ring-2"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, DESC_MAX + 1))}
                placeholder="Explica brevemente la necesidad"
                disabled={loading}
                required
                maxLength={DESC_MAX}
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={triedSubmit && descInvalid ? 'text-red-600' : 'text-slate-500'}>
                  Mínimo {DESC_MIN}, máximo {DESC_MAX}.
                </span>
                <span className={triedSubmit && descInvalid ? 'text-red-600' : 'text-slate-500'}>
                  {descLen}/{DESC_MAX}
                </span>
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Monto solicitado <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-r-0 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  ₡
                </span>
                <input
                  inputMode="decimal"
                  type="text"
                  className="w-full rounded-md border border-l-0 p-2 outline-none ring-blue-500 focus:ring-2"
                  value={montoStr}
                  onChange={(e) => setMontoStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="Ej. 250000"
                  disabled={loading}
                  required
                />
              </div>
              {triedSubmit && montoInvalid && (
                <div className="mt-1 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                  Ingresa un monto mayor a 0.
                </div>
              )}
            </div>

            {/* Área */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Área <span className="text-red-600">*</span>
              </label>

              {esExterno ? (
                /* Colaborador externo: área fija, no editable */
                <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {loadingMiArea ? (
                    <span className="text-slate-400">Cargando tu área…</span>
                  ) : miArea ? (
                    <span className="font-medium">{miArea.nombre}</span>
                  ) : (
                    <span className="text-red-600">Sin área asignada — contacta al administrador.</span>
                  )}
                </div>
              ) : (
                /* Admin/interno: selector de área */
                <select
                  className="w-full rounded-md border p-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
                  disabled={loadingAreas || loading}
                  required
                >
                  <option value="">
                    {loadingAreas ? 'Cargando áreas…' : areas.length === 0 ? 'Sin áreas disponibles' : 'Selecciona un área…'}
                  </option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              )}

              {triedSubmit && areaInvalid && (
                <div className="mt-1 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                  Selecciona el área de destino.
                </div>
              )}

              {/* Saldo disponible — solo visible para roles internos/admin */}
              {!esExterno && areaId && (
                <div className="mt-2">
                  {loadingSaldo ? (
                    <p className="text-xs text-slate-400">Consultando saldo disponible…</p>
                  ) : saldo ? (
                    <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <span className="font-medium">Saldo disponible:</span>{' '}
                      ₡{saldo.disponible.toLocaleString('es-CR')}
                      {' · '}
                      <span>Presupuesto: ₡{saldo.presupuestoTotal.toLocaleString('es-CR')}</span>
                      {saldo.disponible < 0 && (
                        <span className="ml-2 text-amber-600 font-medium">(saldo negativo)</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Adjuntos */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Adjuntos <span className="text-red-600">*</span>
              </label>

              <FileUpload
                multiple
                accept="application/pdf,image/jpeg,image/png,image/webp"
                maxSizeMB={FILE_MAX_MB}
                maxTotalMB={TOTAL_MAX_MB}
                maxFiles={MAX_FILES}
                onChange={(arr: File[]) => setFiles(arr)}
              />

              <p className="mt-1 text-xs text-slate-500">
                Formatos permitidos: <b>PDF, JPG, JPEG, PNG, WEBP</b>. Máx.{' '}
                <b>{FILE_MAX_MB} MB</b> por archivo, <b>{TOTAL_MAX_MB} MB</b> en total, hasta{' '}
                <b>{MAX_FILES}</b> archivos.
              </p>

              {triedSubmit && filesInvalid && (
                <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                  Debes adjuntar al menos un documento o imagen.
                </div>
              )}
            </div>

            {submitError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</div>
            )}
            {errorText && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorText}</div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-white px-5 py-3">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                disabled={loading || (esExterno && !miArea)}
                title={esExterno && !miArea ? 'No tienes área asignada' : undefined}
              >
                {loading ? 'Enviando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
