"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ExportButton from "@/app/admin/_components/ExportButton";
import { CuentasService as _CuentasServiceForExport } from "./services/cuentas-service";
import type { ExportRow } from "@/lib/export";
import {
  ArrowLeft, Plus, RefreshCw, Wallet, TrendingUp, TrendingDown,
  BarChart3, Building2, FolderKanban, Handshake, ChevronRight,
  X, Archive, RotateCcw, Pencil, Check, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CuentasService,
  TransaccionesApiService,
  type Cuenta,
  type CuentaResumen,
  type CuentaDetalle,
  type Transaccion,
  type SaldoDestino,
} from "./services/cuentas-service";
import { API_URL } from "./services/cuentas-service";
import { listAreasSelector, type AreaSelector } from "@/services/areas.service";

// ─── helpers de formato ──────────────────────────────────────────────────────
function fmtCurrency(n: number, moneda = "CRC") {
  try {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: moneda === "CRC" ? 0 : 2,
    }).format(n);
  } catch {
    return `${moneda} ${n.toLocaleString("es-CR")}`;
  }
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

// ─── Modal genérico ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Barra de progreso ───────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-blue-500";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ─── Tarjeta KPI ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color = "blue" }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: "blue" | "green" | "red" | "amber";
}) {
  const bg = { blue: "bg-blue-50", green: "bg-emerald-50", red: "bg-red-50", amber: "bg-amber-50" }[color];
  const text = { blue: "text-blue-700", green: "text-emerald-700", red: "text-red-700", amber: "text-amber-700" }[color];
  const iconBg = { blue: "bg-blue-100", green: "bg-emerald-100", red: "bg-red-100", amber: "bg-amber-100" }[color];
  return (
    <div className={`rounded-xl p-4 ${bg} flex items-start gap-3`}>
      <div className={`rounded-lg p-2 ${iconBg} flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${text} leading-tight truncate`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: Lista de cuentas
// ────────────────────────────────────────────────────────────────────���────────
function CuentasList({
  onSelect,
}: {
  onSelect: (c: Cuenta) => void;
}) {
  const [items, setItems] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showInactivas, setShowInactivas] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", codigo: "", descripcion: "", monedaBase: "CRC", areaId: "" });
  const [editTarget, setEditTarget] = useState<Cuenta | null>(null);
  const [areas, setAreas] = useState<AreaSelector[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CuentasService.list({ q: q || undefined, pageSize: 100 });
      setItems(res.items);
    } catch {
      toast.error("No se pudo cargar las cuentas");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    listAreasSelector().then(setAreas).catch(() => {});
  }, []);

  const filtered = items.filter((c) => showInactivas || c.activa);

  async function handleCreate() {
    if (!form.nombre.trim()) return toast.error("El nombre es requerido");
    if (!form.codigo.trim()) return toast.error("El código es requerido");
    setSaving(true);
    try {
      await CuentasService.create({
        nombre: form.nombre,
        codigo: form.codigo,
        descripcion: form.descripcion,
        monedaBase: form.monedaBase,
        areaId: form.areaId ? Number(form.areaId) : null,
      });
      toast.success("Cuenta creada");
      setShowCreate(false);
      setForm({ nombre: "", codigo: "", descripcion: "", monedaBase: "CRC", areaId: "" });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al crear la cuenta");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editTarget) return;
    if (!form.nombre.trim()) return toast.error("El nombre es requerido");
    setSaving(true);
    try {
      await CuentasService.update(editTarget.id, {
        nombre: form.nombre,
        codigo: form.codigo,
        descripcion: form.descripcion,
        monedaBase: form.monedaBase,
        areaId: form.areaId ? Number(form.areaId) : null,
      });
      toast.success("Cuenta actualizada");
      setEditTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(c: Cuenta) {
    try {
      await CuentasService.archive(c.id);
      toast.success("Cuenta archivada");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al archivar");
    }
  }

  async function handleRestore(c: Cuenta) {
    try {
      await CuentasService.restore(c.id);
      toast.success("Cuenta reactivada");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al reactivar");
    }
  }

  function openEdit(c: Cuenta) {
    setForm({
      nombre: c.nombre,
      codigo: c.codigo,
      descripcion: c.descripcion ?? "",
      monedaBase: c.monedaBase,
      areaId: c.areaId ? String(c.areaId) : "",
    });
    setEditTarget(c);
  }

  const FormBody = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Fondo General" />
      </div>
      <div>
        <Label htmlFor="codigo">Código / Consecutivo *</Label>
        <Input id="codigo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: CUENTA-001" />
      </div>
      <div>
        <Label htmlFor="desc">Descripción (opcional)</Label>
        <Input id="desc" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="moneda">Moneda base</Label>
        <select
          id="moneda"
          value={form.monedaBase}
          onChange={(e) => setForm({ ...form, monedaBase: e.target.value })}
          className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="CRC">₡ Colones (CRC)</option>
          <option value="USD">$ Dólares (USD)</option>
          <option value="EUR">€ Euros (EUR)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="area">Área organizacional (opcional)</Label>
        <select
          id="area"
          value={form.areaId}
          onChange={(e) => setForm({ ...form, areaId: e.target.value })}
          className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Sin área —</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        {areas.length === 0 && (
          <p className="text-xs text-slate-400 mt-1">No hay áreas activas.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título centrado */}
          <div className="text-center py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Contabilidad</h1>
            <p className="text-sm text-slate-500 mt-1">Gestión de cuentas, presupuestos e historial financiero.</p>
          </div>

          {/* Desktop — back izq · nueva cuenta der */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-center h-14 pb-3">
              <Link href="/admin" className="absolute left-0">
                <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Dashboard
                </button>
              </Link>
              <div className="absolute right-0 flex items-center gap-2">
                <ExportButton
                  title="Cuentas Contables"
                  subtitle="Listado de cuentas contables de Fundecodes"
                  filename="cuentas_contables"
                  columns={[
                    { key: "nombre",      header: "Nombre",   width: 24 },
                    { key: "codigo",      header: "Código",   width: 14 },
                    { key: "monedaBase",  header: "Moneda",   width: 10 },
                    { key: "activa",      header: "Activa",   width: 10 },
                    { key: "descripcion", header: "Descripción", width: 30 },
                  ]}
                  currentRows={filtered.map((c) => ({
                    nombre: c.nombre, codigo: c.codigo,
                    monedaBase: c.monedaBase, activa: c.activa ? "Sí" : "No",
                    descripcion: c.descripcion ?? "",
                  } as ExportRow))}
                  fetchAll={async () => {
                    const res = await _CuentasServiceForExport.list({ pageSize: 9999 });
                    return res.items.map((c: any) => ({
                      nombre: c.nombre, codigo: c.codigo,
                      monedaBase: c.monedaBase, activa: c.activa ? "Sí" : "No",
                      descripcion: c.descripcion ?? "",
                    } as ExportRow));
                  }}
                />
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" />
                  Nueva cuenta
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/admin">
              <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </Link>
            <div className="flex gap-2">
              <div className="flex-1">
                <ExportButton
                  title="Cuentas Contables"
                  filename="cuentas_contables"
                  columns={[
                    { key: "nombre",      header: "Nombre",      width: 24 },
                    { key: "codigo",      header: "Código",      width: 14 },
                    { key: "monedaBase",  header: "Moneda",      width: 10 },
                    { key: "activa",      header: "Activa",      width: 10 },
                    { key: "descripcion", header: "Descripción", width: 30 },
                  ]}
                  currentRows={filtered.map((c) => ({
                    nombre: c.nombre, codigo: c.codigo,
                    monedaBase: c.monedaBase, activa: c.activa ? "Sí" : "No",
                    descripcion: c.descripcion ?? "",
                  } as ExportRow))}
                  fetchAll={async () => {
                    const res = await _CuentasServiceForExport.list({ pageSize: 9999 });
                    return res.items.map((c: any) => ({
                      nombre: c.nombre, codigo: c.codigo,
                      monedaBase: c.monedaBase, activa: c.activa ? "Sí" : "No",
                      descripcion: c.descripcion ?? "",
                    } as ExportRow));
                  }}
                />
              </div>
              <Button size="sm" className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Nueva cuenta
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Buscar por nombre o código..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactivas}
                onChange={(e) => setShowInactivas(e.target.checked)}
                className="rounded"
              />
              Mostrar archivadas
            </label>
            <Button variant="ghost" size="sm" onClick={load} className="gap-1">
              <RefreshCw className="h-4 w-4" /> Refrescar
            </Button>
          </div>
        </div>
      </div>

      {/* Listado */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando cuentas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay cuentas</p>
            <p className="text-slate-400 text-sm mt-1">Crea la primera cuenta para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((cuenta) => (
              <CuentaCard
                key={cuenta.id}
                cuenta={cuenta}
                onSelect={onSelect}
                onEdit={openEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal crear */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva cuenta contable">
        {FormBody}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Guardando..." : "Crear cuenta"}
          </Button>
        </div>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar cuenta">
        {FormBody}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
          <Button onClick={handleEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Tarjeta de cuenta en el listado ────────────────────────────────────────
function CuentaCard({
  cuenta, onSelect, onEdit, onArchive, onRestore,
}: {
  cuenta: Cuenta;
  onSelect: (c: Cuenta) => void;
  onEdit: (c: Cuenta) => void;
  onArchive: (c: Cuenta) => void;
  onRestore: (c: Cuenta) => void;
}) {
  const [resumen, setResumen] = useState<CuentaResumen["totales"] | null>(null);

  useEffect(() => {
    CuentasService.getResumen(cuenta.id)
      .then((r) => setResumen(r.totales))
      .catch(() => null);
  }, [cuenta.id]);

  return (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow ${!cuenta.activa ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base text-slate-800 truncate">{cuenta.nombre}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{cuenta.codigo}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!cuenta.activa && (
              <Badge variant="secondary" className="text-xs">Archivada</Badge>
            )}
            <Badge variant="outline" className="text-xs">{cuenta.monedaBase}</Badge>
          </div>
        </div>
        {cuenta.descripcion && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cuenta.descripcion}</p>
        )}
        {cuenta.area && (
          <p className="text-xs text-blue-600 font-medium mt-1">
            📂 {cuenta.area.nombre}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contadores */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5" />
            {cuenta._count?.proyectos ?? "?"} proyectos
          </span>
          <span className="flex items-center gap-1">
            <Handshake className="h-3.5 w-3.5" />
            {cuenta._count?.programas ?? "?"} programas
          </span>
        </div>

        {/* KPIs */}
        {resumen ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-400">Presupuesto</p>
                <p className="font-semibold text-slate-700">{fmtCurrency(resumen.presupuestoAsignado, cuenta.monedaBase)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Disponible</p>
                <p className={`font-semibold ${resumen.disponible < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {fmtCurrency(resumen.disponible, cuenta.monedaBase)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Utilizado</span>
                <span>{fmtPct(resumen.porcentajeUtilizado)}</span>
              </div>
              <ProgressBar pct={resumen.porcentajeUtilizado} />
            </div>
          </>
        ) : (
          <div className="h-10 bg-slate-100 rounded animate-pulse" />
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm gap-1"
            onClick={() => onSelect(cuenta)}
          >
            Ver detalle <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => onEdit(cuenta)}>
            Editar
          </Button>
          {cuenta.activa ? (
            <Button variant="outline" size="sm" className="h-9 text-xs text-red-500 hover:text-red-600 border-red-200" onClick={() => onArchive(cuenta)}>
              Archivar
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-9 text-xs text-emerald-600 hover:text-emerald-700 border-emerald-200" onClick={() => onRestore(cuenta)}>
              Reactivar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: Detalle de una cuenta
// ─────────────────────────────────────────────────────────────────────────────
type DetailTab = "resumen" | "proyectos" | "programas" | "transacciones";

function CuentaDetail({
  cuenta,
  onBack,
}: {
  cuenta: Cuenta;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("resumen");
  const [detalle, setDetalle] = useState<CuentaDetalle | null>(null);
  const [resumen, setResumen] = useState<CuentaResumen | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Todos los proyectos del sistema (para selector de asignación)
  const [allProjects, setAllProjects] = useState<{ id: number; title: string }[]>([]);
  const [allProgramas, setAllProgramas] = useState<{ id: number; nombre: string }[]>([]);

  const loadDetail = useCallback(async () => {
    const [d, r] = await Promise.all([
      CuentasService.getOne(cuenta.id),
      CuentasService.getResumen(cuenta.id),
    ]);
    setDetalle(d);
    setResumen(r);
  }, [cuenta.id]);

  const loadTransacciones = useCallback(async () => {
    setLoadingTx(true);
    try {
      const tx = await TransaccionesApiService.list({ cuentaId: cuenta.id, incluirAnuladas: false });
      setTransacciones(tx);
    } finally {
      setLoadingTx(false);
    }
  }, [cuenta.id]);

  const loadAllDestinos = useCallback(async () => {
    try {
      const [pRes, pgRes] = await Promise.all([
        fetch(`${API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        }).then((r) => r.json()),
        fetch(`${API_URL}/api/programa-voluntariado`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        }).then((r) => r.json()),
      ]);
      setAllProjects(Array.isArray(pRes) ? pRes : (pRes?.items ?? []));
      setAllProgramas(Array.isArray(pgRes) ? pgRes : (pgRes?.items ?? []));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadDetail();
    loadTransacciones();
    loadAllDestinos();
  }, [loadDetail, loadTransacciones, loadAllDestinos]);

  const tot = resumen?.totales;

  const TABS: Array<{ id: DetailTab; label: string }> = [
    { id: "resumen", label: "Resumen" },
    { id: "proyectos", label: `Proyectos (${detalle?.proyectos.length ?? 0})` },
    { id: "programas", label: `Programas (${detalle?.programas.length ?? 0})` },
    { id: "transacciones", label: `Movimientos (${transacciones.length})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Cuentas
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{cuenta.nombre}</h1>
              <p className="text-xs text-slate-400 font-mono">
                {cuenta.codigo} · {cuenta.monedaBase}
                {cuenta.area && (
                  <span className="ml-2 text-blue-500">📂 {cuenta.area.nombre}</span>
                )}
              </p>
            </div>
            {!cuenta.activa && <Badge variant="secondary">Archivada</Badge>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === "resumen" && tot && (
          <ResumenTab resumen={resumen!} moneda={cuenta.monedaBase} />
        )}
        {tab === "proyectos" && detalle && (
          <DestinosTab
            tipo="proyecto"
            items={detalle.proyectos.map((p) => ({ id: p.id, nombre: p.title, extra: p.status }))}
            allItems={allProjects.map((p) => ({ id: p.id, nombre: p.title }))}
            moneda={cuenta.monedaBase}
            onAsignar={async (id, presupuesto) => {
              await CuentasService.asignarProyecto(cuenta.id, id);
              if (presupuesto > 0) await CuentasService.updateProjectPresupuesto(id, presupuesto, cuenta.monedaBase);
              loadDetail();
            }}
            onDesasignar={async (id) => {
              await CuentasService.desasignarProyecto(cuenta.id, id);
              loadDetail();
            }}
            onUpdatePresupuesto={async (id, presupuesto) => {
              await CuentasService.updateProjectPresupuesto(id, presupuesto, cuenta.monedaBase);
              loadDetail();
            }}
          />
        )}
        {tab === "programas" && detalle && (
          <DestinosTab
            tipo="programa"
            items={detalle.programas.map((p) => ({ id: p.id, nombre: p.nombre }))}
            allItems={allProgramas.map((p) => ({ id: p.id, nombre: p.nombre }))}
            moneda={cuenta.monedaBase}
            onAsignar={async (id, presupuesto) => {
              await CuentasService.asignarPrograma(cuenta.id, id);
              if (presupuesto > 0) await CuentasService.updateProgramaPresupuesto(id, presupuesto, cuenta.monedaBase);
              loadDetail();
            }}
            onDesasignar={async (id) => {
              await CuentasService.desasignarPrograma(cuenta.id, id);
              loadDetail();
            }}
            onUpdatePresupuesto={async (id, presupuesto) => {
              await CuentasService.updateProgramaPresupuesto(id, presupuesto, cuenta.monedaBase);
              loadDetail();
            }}
          />
        )}
        {tab === "transacciones" && (
          <TransaccionesTab
            cuentaId={cuenta.id}
            transacciones={transacciones}
            loading={loadingTx}
            onRefresh={loadTransacciones}
            proyectos={detalle?.proyectos ?? []}
            programas={detalle?.programas ?? []}
          />
        )}
      </main>
    </div>
  );
}

// ─── Tab resumen ─────────────────────────────────────────────────────────────
function ResumenTab({ resumen, moneda }: { resumen: CuentaResumen; moneda: string }) {
  const tot = resumen.totales;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Presupuesto asignado" value={fmtCurrency(tot.presupuestoAsignado, moneda)} icon={Wallet} color="blue" />
        <KpiCard label="Ingresos" value={fmtCurrency(tot.ingresos, moneda)} icon={TrendingUp} color="green" sub="Transacciones de tipo ingreso" />
        <KpiCard label="Egresos ejecutados" value={fmtCurrency(tot.egresos, moneda)} icon={TrendingDown} color="red" sub="Gastos y pagos realizados" />
        <KpiCard label="Total disponible" value={fmtCurrency(tot.disponible, moneda)} icon={BarChart3} color={tot.disponible < 0 ? "red" : "blue"} />
        <KpiCard label="Proyectos asignados" value={String(resumen.contadores.proyectos)} icon={FolderKanban} color="amber" />
        <KpiCard label="Programas asignados" value={String(resumen.contadores.programas)} icon={Handshake} color="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilización del presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {fmtCurrency(tot.ejecutado, moneda)} de {fmtCurrency(tot.presupuestoEfectivo, moneda)}
            </span>
            <span className="font-semibold">{fmtPct(tot.porcentajeUtilizado)}</span>
          </div>
          <ProgressBar pct={tot.porcentajeUtilizado} />
          {tot.porcentajeUtilizado >= 90 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Presupuesto casi agotado. Revisar antes de aprobar nuevos pagos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab proyectos / programas ────────────────────────────────────────────────
function DestinosTab({
  tipo, items, allItems, moneda, onAsignar, onDesasignar, onUpdatePresupuesto,
}: {
  tipo: "proyecto" | "programa";
  items: Array<{ id: number; nombre: string; extra?: string }>;
  allItems: Array<{ id: number; nombre: string }>;
  moneda: string;
  onAsignar: (id: number, presupuesto: number) => Promise<void>;
  onDesasignar: (id: number) => Promise<void>;
  onUpdatePresupuesto: (id: number, presupuesto: number) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [presupuestoStr, setPresupuestoStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saldos, setSaldos] = useState<Record<number, SaldoDestino>>({});
  // edición de presupuesto por item: { [id]: string }
  const [editPresupuesto, setEditPresupuesto] = useState<Record<number, string>>({});
  const [savingPresupuesto, setSavingPresupuesto] = useState<Record<number, boolean>>({});

  const reloadSaldo = useCallback(async (id: number) => {
    try {
      const s = tipo === "proyecto"
        ? await TransaccionesApiService.saldoProyecto(id)
        : await TransaccionesApiService.saldoPrograma(id);
      setSaldos((prev) => ({ ...prev, [id]: s }));
    } catch { /* ignore */ }
  }, [tipo]);

  // Carga saldos individuales
  useEffect(() => {
    items.forEach((item) => reloadSaldo(item.id));
  }, [items, reloadSaldo]);

  const assignedIds = new Set(items.map((i) => i.id));
  const unassigned = allItems.filter((i) => !assignedIds.has(i.id));

  async function handleAsignar() {
    if (!selectedId) return toast.error("Selecciona un destino");
    const presupuesto = presupuestoStr ? Number(presupuestoStr.replace(/[^0-9.]/g, "")) : 0;
    if (presupuestoStr && (!Number.isFinite(presupuesto) || presupuesto < 0))
      return toast.error("Presupuesto inválido");
    setSaving(true);
    try {
      await onAsignar(Number(selectedId), presupuesto);
      toast.success(`${tipo === "proyecto" ? "Proyecto" : "Programa"} asignado`);
      setSelectedId("");
      setPresupuestoStr("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDesasignar(id: number) {
    try {
      await onDesasignar(id);
      toast.success("Desasignado correctamente");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al desasignar");
    }
  }

  async function handleSavePresupuesto(id: number) {
    const raw = (editPresupuesto[id] ?? "").trim();
    if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) return toast.error("Ingresa un monto válido (ej. 150000)");
    const presupuesto = Number(raw);
    if (!Number.isFinite(presupuesto) || presupuesto < 0) return toast.error("Presupuesto inválido");
    setSavingPresupuesto((p) => ({ ...p, [id]: true }));
    try {
      await onUpdatePresupuesto(id, presupuesto);
      toast.success("Presupuesto actualizado");
      setEditPresupuesto((p) => { const n = { ...p }; delete n[id]; return n; });
      reloadSaldo(id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al actualizar");
    } finally {
      setSavingPresupuesto((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector de asignación */}
      {unassigned.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Asignar {tipo === "proyecto" ? "proyecto" : "programa"} a esta cuenta
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 min-w-40 h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona...</option>
                {unassigned.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 h-9 rounded-md border border-slate-300 px-3 bg-white">
                <span className="text-sm text-slate-500">₡</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Presupuesto (opcional)"
                  value={presupuestoStr}
                  onChange={(e) => setPresupuestoStr(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-40 text-sm outline-none"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAsignar}
                disabled={saving || !selectedId}
                className="bg-blue-600 hover:bg-blue-700 h-9"
              >
                <Plus className="h-4 w-4 mr-1" /> Asignar
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">El presupuesto se puede establecer ahora o editar después en cada tarjeta.</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de asignados */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="font-medium">Sin {tipo === "proyecto" ? "proyectos" : "programas"} asignados</p>
          <p className="text-sm mt-1">Usa el selector de arriba para asignar uno</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const s = saldos[item.id];
            const isEditing = item.id in editPresupuesto;
            return (
              <Card key={item.id} className="border shadow-sm">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800">{item.nombre}</p>
                      {item.extra && <Badge variant="outline" className="text-xs mt-1">{item.extra}</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDesasignar(item.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Edición inline de presupuesto */}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1 h-8 rounded-md border border-blue-400 px-2 bg-white">
                        <span className="text-xs text-slate-500">₡</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editPresupuesto[item.id]}
                          onChange={(e) => setEditPresupuesto((p) => ({ ...p, [item.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                          className="flex-1 text-sm outline-none"
                          autoFocus
                        />
                      </div>
                      <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700"
                        disabled={savingPresupuesto[item.id]}
                        onClick={() => handleSavePresupuesto(item.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8"
                        onClick={() => setEditPresupuesto((p) => { const n = { ...p }; delete n[item.id]; return n; })}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    s ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-slate-400">Presupuesto</p>
                              <button
                                onClick={() => setEditPresupuesto((p) => ({ ...p, [item.id]: String(s.presupuestoTotal) }))}
                                className="text-xs text-blue-500 hover:underline"
                                title="Editar presupuesto"
                              >
                                Editar
                              </button>
                            </div>
                            <p className="font-semibold">
                              {s.presupuestoTotal === 0
                                ? <span className="text-slate-400 text-xs italic">Sin presupuesto — <button className="text-blue-500 underline" onClick={() => setEditPresupuesto((p) => ({ ...p, [item.id]: "" }))}>asignar</button></span>
                                : fmtCurrency(s.presupuestoTotal, s.moneda)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Disponible</p>
                            <p className={`font-semibold ${s.disponible < 0 ? "text-red-600" : "text-emerald-600"}`}>
                              {fmtCurrency(s.disponible, s.moneda)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Utilizado</span>
                            <span>{fmtPct(s.porcentajeUtilizado)}</span>
                          </div>
                          <ProgressBar pct={s.porcentajeUtilizado} />
                        </div>
                      </>
                    ) : (
                      <div className="h-8 bg-slate-100 rounded animate-pulse" />
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab transacciones ────────────────────────────────────────────────────────
function TransaccionesTab({
  cuentaId, transacciones, loading, onRefresh, proyectos, programas,
}: {
  cuentaId: number;
  transacciones: Transaccion[];
  loading: boolean;
  onRefresh: () => void;
  proyectos: Array<{ id: number; title: string }>;
  programas: Array<{ id: number; nombre: string }>;
}) {
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anulando, setAnulando] = useState<string | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [form, setForm] = useState({
    tipo: "ingreso" as "ingreso" | "egreso",
    moneda: "CRC" as "CRC" | "USD" | "EUR",
    categoria: "",
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().slice(0, 10),
    destinoTipo: "proyecto" as "proyecto" | "programa",
    destinoId: "" as number | "",
  });

  const allDestinos = form.destinoTipo === "proyecto"
    ? proyectos.map((p) => ({ id: p.id, nombre: p.title }))
    : programas.map((p) => ({ id: p.id, nombre: p.nombre }));

  async function handleCreate() {
    if (!form.categoria.trim()) return toast.error("Categoría requerida");
    if (!form.descripcion.trim()) return toast.error("Descripción requerida");
    if (!form.monto || Number(form.monto) <= 0) return toast.error("Monto debe ser positivo");
    if (!form.destinoId) return toast.error("Selecciona un proyecto o programa");

    setSaving(true);
    try {
      const destino = form.destinoTipo === "proyecto"
        ? proyectos.find((p) => p.id === Number(form.destinoId))
        : programas.find((p) => p.id === Number(form.destinoId));

      await TransaccionesApiService.create({
        tipo: form.tipo,
        moneda: form.moneda,
        categoria: form.categoria.trim(),
        descripcion: form.descripcion.trim(),
        monto: Number(form.monto),
        fecha: form.fecha,
        projectId: form.destinoTipo === "proyecto" ? Number(form.destinoId) : undefined,
        programaId: form.destinoTipo === "programa" ? Number(form.destinoId) : undefined,
        proyecto: destino ? ("title" in destino ? destino.title : destino.nombre) : "—",
      });
      toast.success("Transacción registrada");
      setShowNew(false);
      setForm({ ...form, categoria: "", descripcion: "", monto: "", destinoId: "" });
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al registrar");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnular(id: string) {
    if (!motivoAnulacion.trim()) return toast.error("Ingresa un motivo");
    try {
      await TransaccionesApiService.anular(id, motivoAnulacion);
      toast.success("Transacción anulada");
      setAnulando(null);
      setMotivoAnulacion("");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al anular");
    }
  }

  const ingresos = transacciones.filter((t) => t.tipo === "ingreso").reduce((a, t) => a + Number(t.monto), 0);
  const egresos = transacciones.filter((t) => t.tipo === "egreso").reduce((a, t) => a + Number(t.monto), 0);

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-medium uppercase">Total ingresos</p>
          <p className="text-lg font-bold text-emerald-700">{fmtCurrency(ingresos)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium uppercase">Total egresos</p>
          <p className="text-lg font-bold text-red-700">{fmtCurrency(egresos)}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700">Historial de movimientos</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> Registrar movimiento
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando movimientos...</div>
      ) : transacciones.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Sin movimientos registrados</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Categoría</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Descripción</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Destino</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Monto</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">Acción</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((tx) => (
                <tr key={tx.id} className={`border-b border-slate-50 hover:bg-slate-50 ${tx.anuladaAt ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(tx.fecha).toLocaleDateString("es-CR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={tx.tipo === "ingreso" ? "default" : "destructive"}
                      className={tx.tipo === "ingreso" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}
                    >
                      {tx.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{tx.categoria}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{tx.descripcion}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{tx.proyecto}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                    {tx.tipo === "ingreso" ? "+" : "-"}{fmtCurrency(Number(tx.monto), tx.moneda)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!tx.anuladaAt && !tx.paymentId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2 text-xs"
                        onClick={() => { setAnulando(tx.id); setMotivoAnulacion(""); }}
                      >
                        Anular
                      </Button>
                    ) : tx.anuladaAt ? (
                      <span className="text-xs text-slate-400">Anulada</span>
                    ) : (
                      <span className="text-xs text-slate-400">Auto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva transacción */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Registrar movimiento">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <Label>Moneda</Label>
              <select
                value={form.moneda}
                onChange={(e) => setForm({ ...form, moneda: e.target.value as any })}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
              >
                <option value="CRC">₡ CRC</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Categoría</Label>
            <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Materiales, Transporte..." />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monto</Label>
              <Input type="number" min="0" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Destino</Label>
            <div className="flex gap-2 mb-2">
              {(["proyecto", "programa"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, destinoTipo: t, destinoId: "" })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    form.destinoTipo === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t === "proyecto" ? "Proyecto" : "Programa"}
                </button>
              ))}
            </div>
            <select
              value={form.destinoId}
              onChange={(e) => setForm({ ...form, destinoId: e.target.value ? Number(e.target.value) : "" })}
              className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
            >
              <option value="">Selecciona {form.destinoTipo}...</option>
              {allDestinos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </Modal>

      {/* Modal anulación */}
      <Modal open={!!anulando} onClose={() => setAnulando(null)} title="Anular transacción">
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Las transacciones no se eliminan. Se crea una contra-transacción del tipo opuesto para mantener la trazabilidad contable.</p>
          </div>
          <div>
            <Label>Motivo de la anulación *</Label>
            <Input
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Describe el motivo..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setAnulando(null)}>Cancelar</Button>
          <Button
            onClick={() => anulando && handleAnular(anulando)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Confirmar anulación
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function ContabilidadPage() {
  const [selectedCuenta, setSelectedCuenta] = useState<Cuenta | null>(null);

  if (selectedCuenta) {
    return (
      <CuentaDetail
        cuenta={selectedCuenta}
        onBack={() => setSelectedCuenta(null)}
      />
    );
  }

  return <CuentasList onSelect={setSelectedCuenta} />;
}
