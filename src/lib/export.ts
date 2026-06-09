"use client";

/**
 * Utilidades de exportación para PDF (jsPDF + autotable) y Excel (xlsx).
 * Uso:
 *   exportToPDF({ title, columns, rows, filename })
 *   exportToExcel({ columns, rows, filename, sheetName })
 */

export interface ExportColumn {
  /** Clave del objeto en `rows` */
  key: string;
  /** Encabezado de columna visible */
  header: string;
  /** Ancho relativo en PDF (opcional) */
  width?: number;
}

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

// ─── PDF ────────────────────────────────────────────────────────────────────

export async function exportToPDF(options: {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: ExportRow[];
  filename?: string;
  orientation?: "portrait" | "landscape";
}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const {
    title,
    subtitle,
    columns,
    rows,
    filename = "exportacion",
    orientation = "landscape",
  } = options;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  // Encabezado
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(subtitle, 14, 26);
    doc.setTextColor(0);
  }

  const generatedAt = new Date().toLocaleString("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${generatedAt}`, 14, subtitle ? 32 : 26);
  doc.setTextColor(0);

  const startY = subtitle ? 38 : 32;

  const head = [columns.map((c) => c.header)];
  const body = rows.map((r) => columns.map((c) => formatCell(r[c.key])));

  autoTable(doc, {
    head,
    body,
    startY,
    styles: {
      fontSize: 9,
      cellPadding: { top: 2, right: 4, bottom: 2, left: 4 },
    },
    headStyles: {
      fillColor: [30, 64, 175], // blue-800
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [241, 245, 249] }, // slate-100
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, c.width ? { cellWidth: c.width } : {}])
    ),
  });

  doc.save(`${filename}.pdf`);
}

// ─── Excel ───────────────────────────────────────────────────────────────────

export async function exportToExcel(options: {
  columns: ExportColumn[];
  rows: ExportRow[];
  filename?: string;
  sheetName?: string;
  title?: string;
}) {
  const XLSX = await import("xlsx");

  const {
    columns,
    rows,
    filename = "exportacion",
    sheetName = "Datos",
    title,
  } = options;

  const wsData: (string | number | null | undefined)[][] = [];

  // Fila de título opcional
  if (title) {
    wsData.push([title]);
    wsData.push([]);
  }

  // Encabezados
  wsData.push(columns.map((c) => c.header));

  // Filas de datos
  rows.forEach((r) => {
    wsData.push(columns.map((c) => {
      const v = r[c.key];
      if (v == null) return "";
      if (typeof v === "boolean") return v ? "Sí" : "No";
      return v;
    }));
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ancho de columnas
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCell(v: string | number | boolean | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}
