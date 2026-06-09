// src/app/admin/Billing/components/RequestViewModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSolicitud, fetchHistorial } from "../services/solicitudes.api";

type Props = {
  open: boolean;
  solicitudId: number;
  onClose: () => void;
};

// Variables candidatas (en orden de prioridad):
//   1) NEXT_PUBLIC_FILES_BASE_URL  → si se separa el storage (S3, Drive, etc.)
//   2) NEXT_PUBLIC_API_URL         → la que YA usa axios; el back sirve /uploads aquí
//   3) NEXT_PUBLIC_API_BASE        → nombre antiguo, se mantiene por compat
const FILES_BASE = (process.env.NEXT_PUBLIC_FILES_BASE_URL ?? "").replace(/\/+$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const API_BASE_LEGACY = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "");

function originFromUrl(api: string) {
  try {
    if (!api) return "";
    const u = new URL(api);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

function guessDevFilesRoot() {
  if (typeof window === "undefined") return "";
  const { hostname, port, protocol } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalhost && port !== "4000") {
    return `${protocol}//${hostname}:4000`;
  }
  return "";
}

// FILES_ROOT = el ORIGEN (https://api.dominio.com) donde el backend sirve /uploads.
// Por eso quitamos cualquier sufijo /api de la URL configurada.
const FILES_ROOT =
  FILES_BASE ||
  originFromUrl(API_URL) ||
  originFromUrl(API_BASE_LEGACY) ||
  guessDevFilesRoot() ||
  "";

function joinUrl(base: string, path: string) {
  if (!base) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function normalize(s?: string | null) {
  return (s ?? "").toString().trim().toUpperCase();
}
function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function getPublicUrl(a: any): string | null {
  if (typeof a === "string") {
    if (/^https?:\/\//i.test(a)) return a;
    return joinUrl(FILES_ROOT, a);
  }
  const direct = a?.url ?? a?.publicUrl ?? a?.location ?? a?.Location ?? a?.secure_url ?? null;
  if (typeof direct === "string" && direct) {
    if (/^https?:\/\//i.test(direct)) return direct;
    return joinUrl(FILES_ROOT, direct);
  }
  const rel = a?.path ?? a?.ruta ?? a?.filename ?? a?.key ?? null;
  if (typeof rel === "string" && rel) {
    if (/^https?:\/\//i.test(rel)) return rel;
    return joinUrl(FILES_ROOT, rel);
  }
  return null;
}

function getNiceFileName(a: any, index: number) {
  if (typeof a === "string") {
    try {
      const noQuery = a.split("?")[0].split("#")[0];
      const last = noQuery.split(/[/\\]+/).pop();
      if (last) return decodeURIComponent(last);
    } catch {}
    return `archivo-${index + 1}`;
  }
  const first =
    a?.originalName ??
    a?.originalname ??
    a?.nombreOriginal ??
    a?.filename ??
    a?.name ??
    a?.nombre ??
    null;
  if (first) return String(first);
  const anyPath = a?.path ?? a?.ruta ?? a?.url ?? a?.location ?? a?.Location ?? a?.key ?? null;
  if (typeof anyPath === "string" && anyPath) {
    try {
      const noQuery = anyPath.split("?")[0].split("#")[0];
      const last = anyPath.split(/[/\\]+/).pop();
      if (last) return decodeURIComponent(last);
    } catch {}
  }
  return `archivo-${a?.id ?? index + 1}`;
}

function isImageUrl(u: string) {
  const low = u.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/.test(low);
}
function isPdfUrl(u: string) {
  const low = u.toLowerCase();
  return /\.pdf(\?|#|$)/.test(low);
}

function makeDownloadUrl(fileUrl: string, name: string) {
  const q = new URLSearchParams({ url: fileUrl, filename: name });
  return `/api/download?${q.toString()}`;
}

export default function RequestViewModal({ open, solicitudId, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [hist, setHist] = useState<any[] | null>(null);
  const [histErr, setHistErr] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      setPreviewIndex(null);
      setHist(null);
      setHistErr(null);

      try {
        const d = await getSolicitud(solicitudId);
        setData(d);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle";
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }

      try {
        const h = await fetchHistorial(solicitudId);
        const ordered = Array.isArray(h)
          ? [...h].sort((a, b) => {
              const ta = new Date(a.createdAt ?? 0).getTime();
              const tb = new Date(b.createdAt ?? 0).getTime();
              return tb - ta;
            })
          : [];
        setHist(ordered);
      } catch (err: any) {
        setHistErr(err?.message ?? "No se pudo cargar el historial");
      }
    })();
  }, [open, solicitudId]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const estadoDirector = data?.estadoDirector ?? "PENDIENTE";
  const estadoContadora = data?.estadoContadora ?? "PENDIENTE";
  const estado =
    ["APROBADA", "RECHAZADA"].includes(normalize(estadoDirector))
      ? estadoDirector
      : estadoContadora;

  const contadoraReason =
    (data?.comentarioContadora ?? null) ||
    hist?.find((h) => normalize(h.estado) === "DEVUELTA")?.comentario ||
    null;

  const directorReason =
    (data?.comentarioDirector ?? null) ||
    hist?.find((h) => normalize(h.estado) === "RECHAZADA")?.comentario ||
    null;

  const files = useMemo(() => {
    const raw: any[] = Array.isArray((data as any)?.archivos) ? (data as any).archivos : [];
    return raw
      .map((a, i) => {
        const url = getPublicUrl(a);
        if (!url) return null;
        return {
          url,
          name: getNiceFileName(a, i),
          isImage: isImageUrl(url),
          isPdf: isPdfUrl(url),
        };
      })
      .filter(Boolean) as { url: string; name: string; isImage: boolean; isPdf: boolean }[];
  }, [data]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="mb-1 flex items-start justify-between px-5 pt-4">
          <h2 className="text-lg font-semibold">Detalle de solicitud</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-1"
              title="Imprimir solicitud (Ctrl+P)"
            >
              🖨️ Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-600">Cargando…</div>
          ) : errorMsg ? (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</div>
          ) : !data ? (
            <div className="py-8 text-center text-sm text-slate-600">Sin datos</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase text-slate-500">Título</div>
                    {/* ✅ Evita desbordes de textos sin espacios */}
                    <div className="text-slate-800 break-words break-all">{data.titulo}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">Descripción</div>
                    {/* ✅ Mantiene saltos + corta palabras eternas */}
                    <div className="whitespace-pre-wrap break-words break-all text-slate-800">
                      {data.descripcion}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <div className="text-xs uppercase text-slate-500">Estado</div>
                    <div className="text-slate-800">{estado ?? "PENDIENTE"}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase text-slate-500">Creada</div>
                    <div className="text-slate-800">{formatDate((data as any).createdAt)}</div>
                  </div>
                  <div className="min-w-0 col-span-2 md:col-span-1">
                    <div className="text-xs uppercase text-slate-500">Solicitante</div>
                    <div className="text-slate-800 break-words break-all">
                      {(data as any)?.usuario?.name?.trim() || (data as any)?.usuario?.email || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {(contadoraReason || directorReason) && (
                <div className="space-y-2">
                  <div className="text-xs uppercase text-slate-500">Razones / Comentarios</div>

                  {contadoraReason && (
                    <div className="rounded-md border p-2">
                      <div className="mb-1 text-xs font-semibold text-slate-600">
                        Contadora
                        <span className="ml-1 rounded bg-purple-100 px-1 py-0.5 text-[10px] text-purple-700">
                          DEVUELTA
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap break-words break-all text-slate-800">
                        {contadoraReason}
                      </div>
                    </div>
                  )}

                  {directorReason && (
                    <div className="rounded-md border p-2">
                      <div className="mb-1 text-xs font-semibold text-slate-600">
                        Director
                        <span className="ml-1 rounded bg-rose-100 px-1 py-0.5 text-[10px] text-rose-700">
                          RECHAZADA
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap break-words break-all text-slate-800">
                        {directorReason}
                      </div>
                    </div>
                  )}

                  {!contadoraReason && !directorReason && histErr && (
                    <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                      Nota: {histErr}
                    </div>
                  )}
                </div>
              )}

              {/* Adjuntos */}
              <div className="space-y-2">
                <div className="text-xs uppercase text-slate-500">Adjuntos</div>

                {files.length === 0 ? (
                  <div className="text-sm text-slate-600">Sin archivos adjuntos.</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {files.map((f, i) => (
                      <li key={`${f.url}-${i}`} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {/* ✅ elipsis si el nombre es eterno */}
                          <span className="truncate">{f.name}</span>
                          <span className="text-xs text-slate-400">
                            ({f.isImage ? "imagen" : f.isPdf ? "pdf" : "archivo"})
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {(f.isImage || f.isPdf) && (
                            <button
                              type="button"
                              className="rounded-md border border-sky-700 bg-sky-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                              onClick={() => setPreviewIndex(i)}
                            >
                              Ver
                            </button>
                          )}

                          {/* Abrir inline */}
                          <a
                            className="rounded-md border border-indigo-700 bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir ↗
                          </a>

                          {/* Descargar forzado vía proxy del front */}
                          <a
                            className="rounded-md border border-emerald-700 bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                            href={makeDownloadUrl(f.url, f.name)}
                          >
                            Descargar
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Visor simple: img | iframe (PDF) */}
                {previewIndex !== null && files[previewIndex] && (
                  <div className="mt-3 rounded-lg border bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-700 min-w-0">
                        Vista previa:{" "}
                        <span className="font-normal break-words break-all">
                          {files[previewIndex].name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          onClick={() => setPreviewIndex((i) => (i && i > 0 ? i - 1 : 0))}
                          disabled={previewIndex <= 0}
                          title="Anterior"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          onClick={() =>
                            setPreviewIndex((i) =>
                              i !== null && i < files.length - 1 ? i + 1 : i
                            )
                          }
                          disabled={previewIndex >= files.length - 1}
                          title="Siguiente"
                        >
                          ▶
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-700 bg-rose-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                          onClick={() => setPreviewIndex(null)}
                        >
                          Cerrar visor
                        </button>
                      </div>
                    </div>

                    <div className="flex h-[60vh] w-full items-center justify-center overflow-hidden rounded-md bg-white">
                      {files[previewIndex].isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={files[previewIndex].url}
                          alt={files[previewIndex].name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : files[previewIndex].isPdf ? (
                        <iframe
                          src={files[previewIndex].url}
                          className="h-full w-full"
                          title={files[previewIndex].name}
                        />
                      ) : (
                        <div className="text-sm text-slate-600">
                          No hay vista previa disponible.{" "}
                          <a
                            className="text-blue-600 underline"
                            href={files[previewIndex].url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir original
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
