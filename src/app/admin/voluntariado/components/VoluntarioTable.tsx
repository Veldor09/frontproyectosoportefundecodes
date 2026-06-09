"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Voluntario } from "../types/voluntario";
import VoluntarioRow from "./VoluntarioRow";
import VoluntarioForm from "./VoluntarioForm";
import { useVoluntarios } from "../hooks/useVoluntarios";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AsignacionModal from "./AsignacionModal";
import ExportButton from "@/app/admin/_components/ExportButton";
import { apiListVoluntarios } from "../services/voluntarioService";
import type { ExportRow } from "@/lib/export";

const VOL_EXPORT_COLS = [
  { key: "nombre",       header: "Nombre",       width: 24 },
  { key: "nacionalidad", header: "Nacionalidad",  width: 18 },
  { key: "email",        header: "Email",         width: 26 },
  { key: "fechaEntrada", header: "Entrada",       width: 14 },
  { key: "fechaSalida",  header: "Salida",        width: 14 },
  { key: "ong",          header: "ONG",           width: 20 },
];

function volToRow(v: Voluntario): ExportRow {
  return {
    nombre:       v.nombre ?? "",
    nacionalidad: v.nacionalidad ?? "",
    email:        (v as any).email ?? "",
    fechaEntrada: v.fechaEntrada?.slice(0, 10) ?? "",
    fechaSalida:  v.fechaSalida?.slice(0, 10) ?? "",
    ong:          v.ong ?? "",
  };
}

export default function VoluntarioTable() {
  const { data: rawData, total: rawTotal, loading, save, remove } = useVoluntarios();

  // Normalización segura del array
  const lista: Voluntario[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData as Voluntario[];
    if (rawData && Array.isArray((rawData as any).data)) return (rawData as any).data as Voluntario[];
    return [];
  }, [rawData]);

  const total: number = useMemo(() => {
    if (typeof rawTotal === "number") return rawTotal;
    return lista.length;
  }, [rawTotal, lista.length]);

  const [modo, setModo] = useState<"crear" | "editar" | null>(null);
  const [voluntarioEditar, setVoluntarioEditar] = useState<Voluntario | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Control del modal de asignación (fuera de la tabla)
  const [voluntarioAsignar, setVoluntarioAsignar] = useState<Voluntario | null>(null);

  const abrirModalCrear = () => {
    setModo("crear");
    setVoluntarioEditar(null);
  };

  const abrirModalEditar = (v: Voluntario) => {
    setModo("editar");
    setVoluntarioEditar(v);
  };

  const cerrarModal = () => {
    setModo(null);
    setVoluntarioEditar(null);
  };

  const handleGuardar = async (v: Omit<Voluntario, "id"> & { id?: number }) => {
    await save(v as any);
    // Modal is closed by the form itself via onCancel() after saving
  };

  const filtered: Voluntario[] = useMemo(() => {
    return lista.filter((v: Voluntario) =>
      [v.nombre, v.email, v.nacionalidad, v.ong].some((f) =>
        f?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [lista, search]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Voluntarios</h2>
          <p className="text-sm text-slate-500">Crear, editar y administrar voluntarios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            title="Voluntarios"
            subtitle="Registro de voluntarios de Fundecodes"
            filename="voluntarios"
            columns={VOL_EXPORT_COLS}
            currentRows={filtered.map(volToRow)}
            fetchAll={async () => {
              const res = await apiListVoluntarios({ page: 1, pageSize: 9999 });
              const all: Voluntario[] = Array.isArray(res) ? res : (res?.data ?? []);
              return all.map(volToRow);
            }}
          />
          <Button onClick={abrirModalCrear} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" /> Nuevo Voluntario
          </Button>
        </div>
      </div>

      {/* Modal de crear/editar */}
      <Modal
        open={modo !== null}
        onClose={cerrarModal}
        title={modo === "crear" ? "Agregar voluntario(s)" : "Editar voluntario"}
      >
        <VoluntarioForm
          initial={voluntarioEditar ?? undefined}
          onSave={handleGuardar}
          onCancel={cerrarModal}
        />
      </Modal>

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

      {/* Tabla */}
      {loading && <p className="text-sm text-slate-500">Cargando voluntarios...</p>}
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Entrada</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Salida</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ONG</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <VoluntarioRow
                  key={`vol-${v.id ?? "noid"}-${i}`}
                  voluntario={v}
                  onEdit={() => abrirModalEditar(v)}
                  onDelete={() => remove(v.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de asignación: fuera de la tabla */}
      {voluntarioAsignar && (
        <AsignacionModal
          voluntario={voluntarioAsignar}
          open={!!voluntarioAsignar}
          onClose={() => setVoluntarioAsignar(null)}
        />
      )}

      {/* Paginación local (opcional) */}
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Mostrando {filtered.length} de {total} voluntarios</span>
        <div className="flex gap-2">
          <Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Button size="sm" disabled={page * 10 >= total} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
