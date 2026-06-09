"use client";

import { useMemo, useState } from "react";
import { Users, Globe, Flag } from "lucide-react";
import VisitacionNav from "./components/VisitacionNav";
import VisitacionForm from "./components/VisitacionForm";
import VisitacionTable from "./components/VisitacionTable";
import { useVisitaciones } from "./hooks/useVisitaciones";
import type { Visitacion } from "./types/visitacion";
import ExportButton from "@/app/admin/_components/ExportButton";
import type { ExportRow } from "@/lib/export";
import { visitacionService } from "./services/visitacion.service";

const EXPORT_COLS = [
  { key: "fecha",         header: "Fecha",        width: 18 },
  { key: "totalPersonas", header: "Total",         width: 12 },
  { key: "nacionales",    header: "Nacionales",    width: 14 },
  { key: "pctNac",        header: "% Nac.",        width: 10 },
  { key: "extranjeros",   header: "Extranjeros",   width: 14 },
  { key: "pctExt",        header: "% Ext.",        width: 10 },
  { key: "notas",         header: "Notas",         width: 30 },
];

function toExportRow(v: Visitacion): ExportRow {
  const ext = Math.max(0, v.totalPersonas - v.nacionales);
  const pctNac = v.totalPersonas ? `${Math.round((v.nacionales / v.totalPersonas) * 100)}%` : "0%";
  const pctExt = v.totalPersonas ? `${Math.round((ext / v.totalPersonas) * 100)}%` : "0%";
  return {
    fecha:         v.fecha?.slice(0, 10) ?? "",
    totalPersonas: v.totalPersonas,
    nacionales:    v.nacionales,
    pctNac,
    extranjeros:   ext,
    pctExt,
    notas:         v.notas ?? "",
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function VisitacionPage() {
  const {
    items, total, page, totalPages, search, loading, error,
    setPage, setSearch, refresh, save, remove,
  } = useVisitaciones();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visitacion | null>(null);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: Visitacion) {
    setEditing(item);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSave(payload: Parameters<typeof save>[0]) {
    await save(payload);
    handleClose();
  }

  async function handleDelete(item: Visitacion) {
    await remove(item.id);
  }

  // Estadísticas agregadas de la página actual
  const stats = useMemo(() => {
    const totalPersonas = items.reduce((s, i) => s + (i.totalPersonas ?? 0), 0);
    const totalNacionales = items.reduce((s, i) => s + (i.nacionales ?? 0), 0);
    const totalExtranjeros = items.reduce((s, i) => s + Math.max(0, i.totalPersonas - i.nacionales), 0);
    return { totalPersonas, totalNacionales, totalExtranjeros };
  }, [items]);

  const pct = (part: number, tot: number) =>
    tot ? ` (${Math.round((part / tot) * 100)}%)` : "";

  return (
    <main className="min-h-screen bg-slate-50">
      <VisitacionNav
        onNew={openNew}
        rightAction={
          <ExportButton
            title="Visitación"
            subtitle="Registro de visitas nacionales y extranjeras"
            filename="visitacion"
            columns={EXPORT_COLS}
            currentRows={items.map(toExportRow)}
            fetchAll={async () => {
              const res = await visitacionService.list({ page: 1, limit: 9999 });
              return res.data.map(toExportRow);
            }}
          />
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Total visitantes"
            value={stats.totalPersonas.toLocaleString("es-CR")}
            color="bg-blue-600"
          />
          <StatCard
            icon={Flag}
            label={`Nacionales${pct(stats.totalNacionales, stats.totalPersonas)}`}
            value={stats.totalNacionales.toLocaleString("es-CR")}
            color="bg-blue-600"
          />
          <StatCard
            icon={Globe}
            label={`Extranjeros${pct(stats.totalExtranjeros, stats.totalPersonas)}`}
            value={stats.totalExtranjeros.toLocaleString("es-CR")}
            color="bg-amber-500"
          />
        </div>

        {/* Tabla */}
        <VisitacionTable
          items={items}
          total={total}
          page={page}
          totalPages={totalPages}
          loading={loading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onRefresh={refresh}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal crear / editar */}
      <VisitacionForm
        open={formOpen}
        initial={editing}
        onClose={handleClose}
        onSave={handleSave}
      />
    </main>
  );
}
