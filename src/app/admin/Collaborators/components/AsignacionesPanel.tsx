"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, Plus, X, FolderKanban, Handshake, ChevronDown, ChevronRight } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface FacturaColaborador {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  estado: string;
  _count: { asignaciones: number };
}

interface Asignacion {
  id: number;
  collaboratorId: number;
  projectId: number | null;
  programaId: number | null;
  createdAt: string;
  project?: { id: number; title: string; status: string } | null;
  programa?: { id: number; nombre: string; lugar: string } | null;
}

interface DestinoItem { id: number; nombre: string; }

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(`${API_URL}${path}`, { method: "DELETE", headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Fila expandible de un colaborador factura ───────────────────────────────
function ColaboradorRow({
  colaborador,
  allProyectos,
  allProgramas,
}: {
  colaborador: FacturaColaborador;
  allProyectos: DestinoItem[];
  allProgramas: DestinoItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<"proyecto" | "programa">("proyecto");
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const loadAsignaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Asignacion[]>(`/api/collaborators/${colaborador.id}/asignaciones`);
      setAsignaciones(data);
    } catch {
      toast.error("No se pudo cargar las asignaciones");
    } finally {
      setLoading(false);
    }
  }, [colaborador.id]);

  useEffect(() => {
    if (expanded) loadAsignaciones();
  }, [expanded, loadAsignaciones]);

  const assignedProjectIds = new Set(asignaciones.filter((a) => a.projectId).map((a) => a.projectId!));
  const assignedProgramaIds = new Set(asignaciones.filter((a) => a.programaId).map((a) => a.programaId!));

  const availableItems = selectedTipo === "proyecto"
    ? allProyectos.filter((p) => !assignedProjectIds.has(p.id))
    : allProgramas.filter((p) => !assignedProgramaIds.has(p.id));

  async function handleAsignar() {
    if (!selectedId) return toast.error("Selecciona un destino");
    setSaving(true);
    try {
      const body = selectedTipo === "proyecto"
        ? { projectId: Number(selectedId) }
        : { programaId: Number(selectedId) };
      await apiPost(`/api/collaborators/${colaborador.id}/asignaciones`, body);
      toast.success("Asignación creada");
      setSelectedId("");
      loadAsignaciones();
    } catch (e: any) {
      const msg = tryParseError(e);
      toast.error(msg ?? "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDesasignar(asignacionId: number) {
    try {
      await apiDelete(`/api/collaborators/${colaborador.id}/asignaciones/${asignacionId}`);
      toast.success("Asignación eliminada");
      loadAsignaciones();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </td>
        <td className="px-4 py-3 font-medium text-slate-800">{colaborador.nombreCompleto}</td>
        <td className="px-4 py-3 text-slate-500 text-sm">{colaborador.correo}</td>
        <td className="px-4 py-3">
          <Badge variant={colaborador.estado === "ACTIVO" ? "default" : "secondary"}
            className={colaborador.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : ""}>
            {colaborador.estado}
          </Badge>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {colaborador._count.asignaciones}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-6 py-4">
            {loading ? (
              <p className="text-sm text-slate-400">Cargando asignaciones...</p>
            ) : (
              <div className="space-y-4">
                {/* Lista de asignaciones actuales */}
                {asignaciones.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin asignaciones. Agrega proyectos o programas abajo.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {asignaciones.map((a) => {
                      const label = a.project?.title ?? a.programa?.nombre ?? "—";
                      const isProject = !!a.projectId;
                      return (
                        <div
                          key={a.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
                            isProject ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-violet-50 border-violet-200 text-violet-700"
                          }`}
                        >
                          {isProject ? <FolderKanban className="h-3.5 w-3.5" /> : <Handshake className="h-3.5 w-3.5" />}
                          {label}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDesasignar(a.id); }}
                            className="ml-1 text-current opacity-60 hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Formulario de asignación */}
                <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <div className="flex gap-1 mt-1">
                      {(["proyecto", "programa"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={(e) => { e.stopPropagation(); setSelectedTipo(t); setSelectedId(""); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            selectedTipo === t ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          {t === "proyecto" ? "Proyecto" : "Programa"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-40">
                    <Label className="text-xs">Destino</Label>
                    <select
                      value={selectedId}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
                      className="mt-1 w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none"
                    >
                      <option value="">Selecciona...</option>
                      {availableItems.map((i) => (
                        <option key={i.id} value={i.id}>{i.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    disabled={saving || !selectedId}
                    onClick={(e) => { e.stopPropagation(); handleAsignar(); }}
                    className="bg-blue-600 hover:bg-blue-700 h-9"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Asignar
                  </Button>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function tryParseError(e: unknown): string | null {
  try {
    const msg = (e as any)?.message;
    const parsed = JSON.parse(msg);
    return parsed?.message ?? null;
  } catch {
    return null;
  }
}

// ─── Panel principal ─────────────────────────────────────────────────────────
export default function AsignacionesPanel() {
  const [colaboradores, setColaboradores] = useState<FacturaColaborador[]>([]);
  const [allProyectos, setAllProyectos] = useState<DestinoItem[]>([]);
  const [allProgramas, setAllProgramas] = useState<DestinoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [colabs, projs, progs] = await Promise.all([
        apiGet<any>(`/api/collaborators/factura?q=${encodeURIComponent(q)}&pageSize=100`),
        apiGet<any>("/api/projects?pageSize=200"),
        apiGet<any>("/api/programa-voluntariado"),
      ]);

      setColaboradores(colabs?.items ?? []);
      const projArr = Array.isArray(projs) ? projs : (projs?.items ?? projs?.data ?? []);
      const progArr = Array.isArray(progs) ? progs : (progs?.items ?? []);
      setAllProyectos(projArr.map((p: any) => ({ id: p.id, nombre: p.title })));
      setAllProgramas(progArr.map((p: any) => ({ id: p.id, nombre: p.nombre })));
    } catch {
      toast.error("No se pudo cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Asignaciones de Proyectos y Programas</h2>
          <p className="text-sm text-slate-500">
            Controla a qué proyectos y programas puede referir cada colaborador factura al crear solicitudes de pago.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 flex-shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Input
        placeholder="Buscar por nombre o correo..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Colaborador</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Correo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Asignaciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  Cargando colaboradores...
                </td>
              </tr>
            ) : colaboradores.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No hay colaboradores de tipo <strong>colaboradorfactura</strong>.
                </td>
              </tr>
            ) : (
              colaboradores.map((c) => (
                <ColaboradorRow
                  key={c.id}
                  colaborador={c}
                  allProyectos={allProyectos}
                  allProgramas={allProgramas}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
