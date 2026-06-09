"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Sancion } from "../types/sancion";
import type { Voluntario } from "../types/voluntario";
import SancionForm from "./SancionForm";
import { useSanciones } from "../hooks/useSanciones";
import { useVoluntarios } from "../hooks/useVoluntarios";
import { Plus, Search, AlertTriangle, Ban } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "./ConfirmDialog";
import ExportButton from "@/app/admin/_components/ExportButton";
import { listSanciones } from "../services/sancionService";
import type { ExportRow } from "@/lib/export";

const SANCION_EXPORT_COLS = [
  { key: "voluntario",  header: "Voluntario",   width: 24 },
  { key: "tipo",        header: "Tipo",          width: 16 },
  { key: "estado",      header: "Estado",        width: 12 },
  { key: "motivo",      header: "Motivo",        width: 28 },
  { key: "fechaInicio", header: "Fecha inicio",  width: 14 },
  { key: "fechaVence",  header: "Vencimiento",   width: 14 },
];

function sancionToRow(s: Sancion): ExportRow {
  return {
    voluntario:  (s as any).voluntario?.nombreCompleto ?? (s as any).voluntario?.nombre ?? String(s.voluntarioId ?? ""),
    tipo:        s.tipo ?? "",
    estado:      s.estado ?? "",
    motivo:      s.motivo ?? "",
    fechaInicio: s.fechaInicio?.slice(0, 10) ?? "",
    fechaVence:  s.fechaVencimiento?.slice(0, 10) ?? "",
  };
}

// NUEVO: filtro por sanciones
type FiltroSancion = "TODOS" | "CON" | "SIN";

export default function SancionTable() {
  const { data: voluntarios, loading: loadingVoluntarios } = useVoluntarios();
  const { data: sanciones, loading: loadingSanciones, save, revocar, remove } = useSanciones();

  const [voluntarioParaSancion, setVoluntarioParaSancion] = useState<Voluntario | null>(null);
  const [sancionEditar, setSancionEditar] = useState<Sancion | null>(null);
  const [filtroSancion, setFiltroSancion] = useState<FiltroSancion>("TODOS");
  const [search, setSearch] = useState("");
  const [sancionAEliminar, setSancionAEliminar] = useState<Sancion | null>(null);
  const [sancionARevocar, setSancionARevocar] = useState<Sancion | null>(null);

  const listaVol: Voluntario[] = useMemo(
    () => (Array.isArray(voluntarios) ? (voluntarios as Voluntario[]) : []),
    [voluntarios]
  );
  const listaSanciones: Sancion[] = useMemo(
    () => (Array.isArray(sanciones) ? (sanciones as Sancion[]) : []),
    [sanciones]
  );

  // Añadimos las sanciones activas a cada voluntario
  const voluntariosConSanciones = useMemo(
    () =>
      listaVol.map((v) => ({
        ...v,
        sancionesActivas: listaSanciones.filter(
          (s) => s.voluntarioId === v.id && s.estado === "ACTIVA"
        ),
      })),
    [listaVol, listaSanciones]
  );

  const abrirModalNuevaSancion = (voluntario: Voluntario) => {
    setVoluntarioParaSancion(voluntario);
    setSancionEditar(null);
  };
  const abrirModalEditarSancion = (sancion: Sancion) => {
    setSancionEditar(sancion);
    setVoluntarioParaSancion(null);
  };
  const cerrarModal = () => {
    setVoluntarioParaSancion(null);
    setSancionEditar(null);
  };

  const handleGuardar = async (s: Omit<Sancion, "id"> & { id?: number }) => {
    await save(s);
    cerrarModal();
  };
  const handleRevocar = async (sancion: Sancion) => {
    await revocar(sancion.id, "Admin");
    setSancionARevocar(null);
  };
  const handleEliminar = async (sancion: Sancion) => {
    await remove(sancion.id);
    setSancionAEliminar(null);
  };

  // Filtrado por "Con sanción / Sin sanción" + búsqueda
  const filtered = useMemo(() => {
    return voluntariosConSanciones
      .filter((v) => {
        const tieneActivas = (v as any).sancionesActivas?.length > 0;
        if (filtroSancion === "CON") return tieneActivas;
        if (filtroSancion === "SIN") return !tieneActivas;
        return true; // TODOS
      })
      .filter((v) =>
        [v.nombre, v.email, v.nacionalidad, v.ong]
          .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
      );
  }, [voluntariosConSanciones, filtroSancion, search]);

  const loading = loadingVoluntarios || loadingSanciones;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Gestión de Sanciones
          </h2>
          <p className="text-sm text-slate-500">
            Administrar sanciones disciplinarias por voluntario
          </p>
        </div>
        <ExportButton
          title="Sanciones"
          subtitle="Registro de sanciones disciplinarias"
          filename="sanciones"
          columns={SANCION_EXPORT_COLS}
          currentRows={listaSanciones.map(sancionToRow)}
          fetchAll={async () => {
            const res = await listSanciones({ page: 1, limit: 9999 });
            return (res.data ?? []).map(sancionToRow);
          }}
        />
      </div>

      {/* Modal */}
      <Modal
        open={voluntarioParaSancion !== null || sancionEditar !== null}
        onClose={cerrarModal}
        title={sancionEditar ? "Editar sanción" : "Agregar sanción"}
      >
        <SancionForm
          initial={sancionEditar ?? undefined}
          voluntarioPreseleccionado={voluntarioParaSancion ?? undefined}
          onSave={handleGuardar}
          onCancel={cerrarModal}
        />
      </Modal>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        {/* Buscador */}
        <div className="flex-1 max-w-lg">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Buscar por nombre, email, nacionalidad u ONG
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Ej. María Gómez"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtro por sanción — <select> nativo */}
        <div className="w-full sm:w-56">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Filtrar por sanción
          </label>
          <select
            value={filtroSancion}
            onChange={(e) => setFiltroSancion(e.target.value as FiltroSancion)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos</option>
            <option value="CON">Con sanción</option>
            <option value="SIN">Sin sanción</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            Cargando voluntarios...
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-slate-500">No se encontraron voluntarios.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-lg">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nacionalidad</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ONG</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Sanciones</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((voluntario, i) => (
                <tr
                  key={`vol-${voluntario.id}-${i}`}
                  className="hover:bg-slate-50 border-b border-slate-200"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{voluntario.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{voluntario.nacionalidad ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{voluntario.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{voluntario.ong ?? "—"}</td>
                  <td className="px-4 py-3">
                    {(voluntario as any).sancionesActivas?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(voluntario as any).sancionesActivas.map((s: Sancion) => {
                          const dias = s.fechaVencimiento
                            ? Math.max(0, Math.ceil(
                                (new Date(s.fechaVencimiento).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                              ))
                            : null;
                          return (
                            <Badge
                              key={s.id}
                              variant="destructive"
                              className="bg-red-100 text-red-700 text-xs"
                              title={s.fechaVencimiento
                                ? `Vence: ${new Date(s.fechaVencimiento).toLocaleDateString("es-CR")}`
                                : "Permanente"}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {s.tipo}
                              {dias !== null && dias > 0 && <span className="ml-1">({dias}d)</span>}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">Sin sanción</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => abrirModalNuevaSancion(voluntario)}
                        className="gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                      >
                        <Plus className="h-3 w-3" /> Agregar Sanción
                      </Button>

                      {(voluntario as any).sancionesActivas?.map((s: Sancion) => (
                        <div key={s.id} className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEditarSancion(s)}
                            className="text-xs px-2 py-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSancionARevocar(s)}
                            className="text-xs px-2 py-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Ban className="h-3 w-3 mr-1" /> Revocar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ConfirmDialogs */}
      <ConfirmDialog
        open={!!sancionAEliminar}
        onOpenChange={(open: boolean) => {
          if (!open) setSancionAEliminar(null);
        }}
        onConfirm={() =>
          sancionAEliminar ? handleEliminar(sancionAEliminar) : Promise.resolve()
        }
        title="Eliminar Sanción"
        description="¿Está seguro de que desea eliminar permanentemente esta sanción?"
      />

      <ConfirmDialog
        open={!!sancionARevocar}
        onOpenChange={(open: boolean) => {
          if (!open) setSancionARevocar(null);
        }}
        onConfirm={() =>
          sancionARevocar ? handleRevocar(sancionARevocar) : Promise.resolve()
        }
        title="Revocar Sanción"
        description="¿Está seguro de que desea revocar esta sanción activa?"
      />

      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>
          Mostrando {filtered.length} de {listaVol.length} voluntarios
        </span>
      </div>
    </div>
  );
}
