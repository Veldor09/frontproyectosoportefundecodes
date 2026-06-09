"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from "lucide-react";
import type { ExportColumn, ExportRow } from "@/lib/export";

interface Props {
  /** Título del documento / hoja */
  title: string;
  /** Subtítulo opcional (solo PDF) */
  subtitle?: string;
  /** Nombre base del archivo sin extensión */
  filename?: string;
  /** Columnas a exportar */
  columns: ExportColumn[];
  /** Función que devuelve TODOS los registros (sin paginar) */
  fetchAll: () => Promise<ExportRow[]>;
  /** Registros de la página actual (para "exportar página") */
  currentRows?: ExportRow[];
  /** Orientación del PDF */
  pdfOrientation?: "portrait" | "landscape";
}

type ExportFormat = "pdf" | "excel";
type ExportScope = "page" | "all";

export default function ExportButton({
  title,
  subtitle,
  filename,
  columns,
  fetchAll,
  currentRows = [],
  pdfOrientation = "landscape",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleExport(format: ExportFormat, scope: ExportScope) {
    const key = `${format}-${scope}`;
    setLoadingKey(key);
    setLoading(true);
    setOpen(false);

    try {
      const rows = scope === "page" ? currentRows : await fetchAll();

      if (format === "pdf") {
        const { exportToPDF } = await import("@/lib/export");
        await exportToPDF({
          title,
          subtitle,
          columns,
          rows,
          filename: filename ?? title.toLowerCase().replace(/\s+/g, "_"),
          orientation: pdfOrientation,
        });
      } else {
        const { exportToExcel } = await import("@/lib/export");
        await exportToExcel({
          title,
          columns,
          rows,
          filename: filename ?? title.toLowerCase().replace(/\s+/g, "_"),
          sheetName: title.slice(0, 31),
        });
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Error al exportar. Revisa la consola para más detalles.");
    } finally {
      setLoading(false);
      setLoadingKey(null);
    }
  }

  const isLoading = (f: ExportFormat, s: ExportScope) => loadingKey === `${f}-${s}` && loading;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Exportar
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 text-sm">
          {/* PDF */}
          <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">PDF</p>

          <button
            type="button"
            onClick={() => handleExport("pdf", "page")}
            disabled={currentRows.length === 0}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading("pdf", "page") ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            ) : (
              <FileText className="w-4 h-4 text-red-500" />
            )}
            Página actual
          </button>

          <button
            type="button"
            onClick={() => handleExport("pdf", "all")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {isLoading("pdf", "all") ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            ) : (
              <FileText className="w-4 h-4 text-red-500" />
            )}
            Todos los registros
          </button>

          <div className="my-1.5 border-t border-slate-100" />

          {/* Excel */}
          <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Excel</p>

          <button
            type="button"
            onClick={() => handleExport("excel", "page")}
            disabled={currentRows.length === 0}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading("excel", "page") ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            )}
            Página actual
          </button>

          <button
            type="button"
            onClick={() => handleExport("excel", "all")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {isLoading("excel", "all") ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            )}
            Todos los registros
          </button>
        </div>
      )}
    </div>
  );
}
