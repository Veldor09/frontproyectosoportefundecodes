// src/app/admin/Collaborators/components/CollaboratorsTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCollaborators, type Estado } from "../hooks/useCollaborators";
import type { Collaborator as UiCollaborator } from "../types/collaborators.types";

import AddCollaboratorModal from "./AddCollaboratorModal";
import CollaboratorsRow from "./CollaboratorsRow";
import ConfirmModal, { type ConfirmState } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import ExportButton from "@/app/admin/_components/ExportButton";
import { apiListCollaborators } from "../services/collaborators.api";
import type { ExportRow } from "@/lib/export";

const COLLAB_EXPORT_COLS = [
  { key: "fullName",       header: "Nombre",          width: 24 },
  { key: "email",          header: "Correo",           width: 26 },
  { key: "role",           header: "Rol",              width: 22 },
  { key: "status",         header: "Estado",           width: 12 },
  { key: "identification", header: "Identificación",   width: 16 },
  { key: "phone",          header: "Teléfono",         width: 16 },
];

const ROLE_LABEL: Record<string, string> = {
  admin:                          "Admin",
  colaboradorfactura:             "Factura",
  colaboradorvoluntariado:        "Voluntariado",
  colaboradorproyecto:            "Proyecto",
  colaboradorcontabilidad:        "Contabilidad",
  colaboradorvisitacion:          "Visitación",
  colaboradorsolicitante:         "Solicitante",
  colaboradorvoluntariadoexterno: "Vol. Externo",
};

function collabToRow(c: UiCollaborator): ExportRow {
  const rolesDisplay = c.roles?.length ? c.roles.join(", ") : (c.role ?? "");
  return {
    fullName:       c.fullName ?? "",
    email:          c.email ?? "",
    role:           rolesDisplay,
    status:         c.status ?? "",
    identification: (c as any).identification ?? "",
    phone:          c.phone ?? "",
  };
}

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function toUi(x: any): UiCollaborator {
  const rawRoles: string[] | undefined =
    Array.isArray(x.roles) && x.roles.length > 0 ? x.roles : undefined;
  return {
    id: x.id,
    fullName: x.fullName ?? x.nombreCompleto ?? x.nombre_completo ?? "",
    email: x.email ?? x.correo ?? "",
    phone: x.phone ?? x.telefono ?? null,
    role: x.role ?? x.rol ?? "",
    roles: rawRoles,
    identification: x.identification ?? x.cedula ?? "",
    birthdate: x.birthdate ?? x.fechaNacimiento ?? x.fecha_nacimiento ?? null,
    status: (x.status ?? x.estado) === "INACTIVO" ? "INACTIVO" : "ACTIVO",
  };
}

function formatBirthdate(bd: string | null | undefined): string {
  if (!bd) return "—";
  const [y, m, d] = bd.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

type EstadoFiltroLocal = "TODOS" | Estado;

export default function CollaboratorsTable() {
  const {
    data: itemsRaw,
    total,
    loading,
    page, setPage,
    pageSize, setPageSize,
    search, setSearch,
    estado, setEstado,
    toggle, remove,
  } = useCollaborators();

  const [modo, setModo] = useState<"crear" | "editar" | null>(null);
  const [colaboradorEditar, setColaboradorEditar] = useState<UiCollaborator | null>(null);
  const [mobileConfirm, setMobileConfirm] = useState<ConfirmState | null>(null);

  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltroLocal>(
    estado === "ALL" ? "TODOS" : (estado as Estado)
  );

  useEffect(() => {
    setEstadoFiltro(estado === "ALL" ? "TODOS" : (estado as Estado));
  }, [estado]);

  const debouncedSearch = useDebouncedValue(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch, setPage]);

  const abrirModalCrear = () => { setModo("crear"); setColaboradorEditar(null); };
  const abrirModalEditar = (c: UiCollaborator) => { setModo("editar"); setColaboradorEditar(c); };
  const cerrarModal = () => { setModo(null); setColaboradorEditar(null); };

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page * pageSize < total, [page, pageSize, total]);
  const items = useMemo(() => itemsRaw.map(toUi), [itemsRaw]);

  const handleEstadoChange = (value: EstadoFiltroLocal) => {
    setEstadoFiltro(value);
    const mapped = value === "TODOS" ? "ALL" : value;
    setEstado(mapped as any);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Gestión de Colaboradores</h2>
          <p className="text-sm text-slate-500">Crear, editar y administrar colaboradores registrados</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ExportButton
            title="Colaboradores"
            subtitle="Listado de colaboradores de Fundecodes"
            filename="colaboradores"
            columns={COLLAB_EXPORT_COLS}
            currentRows={items.map(collabToRow)}
            fetchAll={async () => {
              const res = await apiListCollaborators({ page: 1, pageSize: 9999 });
              const all: UiCollaborator[] = Array.isArray(res) ? res : (res?.data ?? []);
              return all.map(toUi).map(collabToRow);
            }}
          />
          <Button onClick={abrirModalCrear} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none">
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        </div>
      </div>

      {/* ── Modal crear/editar ──────────────────────────── */}
      <AddCollaboratorModal
        key={`${modo ?? "cerrado"}-${colaboradorEditar?.id ?? "nuevo"}`}
        open={modo !== null}
        mode={modo}
        initial={colaboradorEditar}
        onClose={cerrarModal}
        onSaved={(action) => { if (action === "created") setPage(1); }}
      />

      {/* ── Buscador y filtro ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Nombre, correo o identificación"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select
            value={estadoFiltro}
            onChange={(e) => handleEstadoChange(e.target.value as EstadoFiltroLocal)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && <p className="text-sm text-slate-500 py-4 text-center">Cargando colaboradores…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500 py-4 text-center">No se encontraron colaboradores.</p>
      )}

      {/* ── MOBILE: tarjetas ────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="md:hidden space-y-3">
          {items.map((c) => {
            const isActive = c.status !== "INACTIVO";
            const currentEstado: "ACTIVO" | "INACTIVO" = isActive ? "ACTIVO" : "INACTIVO";
            const roleList = c.roles?.length ? c.roles : [c.role].filter(Boolean) as string[];
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                {/* Nombre + estado */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{c.fullName}</p>
                    <p className="text-sm text-slate-500 truncate">{c.email}</p>
                    {c.phone && <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
                    isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Roles */}
                {roleList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {roleList.map((r) => (
                      <span key={r} className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                        {ROLE_LABEL[r] ?? r}
                      </span>
                    ))}
                  </div>
                )}

                {/* Datos secundarios */}
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5">
                  {c.identification && <span>ID: {c.identification}</span>}
                  <span>Nac.: {formatBirthdate(c.birthdate)}</span>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1 border-t border-slate-200">
                  <button
                    onClick={() => abrirModalEditar(c)}
                    className="flex-1 rounded-md py-2 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setMobileConfirm({
                      title: isActive ? "Desactivar colaborador" : "Activar colaborador",
                      message: `El colaborador "${c.fullName}" pasará a estar ${isActive ? "inactivo" : "activo"}.`,
                      confirmLabel: isActive ? "Desactivar" : "Activar",
                      variant: isActive ? "warning" : "default",
                      onConfirm: () => toggle(c.id, currentEstado),
                    })}
                    className={`flex-1 rounded-md py-2 text-xs font-medium border transition-colors ${
                      isActive
                        ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                        : "text-green-600 border-green-200 hover:bg-green-50"
                    }`}
                  >
                    {isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => setMobileConfirm({
                      title: "Eliminar colaborador",
                      message: `¿Eliminar permanentemente a "${c.fullName}"? Esta acción no se puede deshacer.`,
                      confirmLabel: "Eliminar",
                      variant: "danger",
                      onConfirm: () => remove(c.id),
                    })}
                    className="flex-1 rounded-md py-2 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DESKTOP: tabla ──────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-lg">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Correo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Teléfono</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Rol/Área</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Identificación</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nacimiento</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const currentEstado: "ACTIVO" | "INACTIVO" =
                  c.status === "INACTIVO" ? "INACTIVO" : "ACTIVO";
                return (
                  <CollaboratorsRow
                    key={c.id}
                    collaborator={c}
                    onEdit={() => abrirModalEditar(c)}
                    onToggle={() => toggle(c.id, currentEstado)}
                    onDelete={() => remove(c.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Paginación ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center text-sm text-slate-600">
        <span>Mostrando {items.length} de {total} colaboradores</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs sm:text-sm">Por página</span>
            <select
              value={String(pageSize)}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="block w-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!canPrev} onClick={() => setPage(page - 1)}>Anterior</Button>
            <Button size="sm" disabled={!canNext} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>
        </div>
      </div>

      {/* Confirmación mobile */}
      <ConfirmModal state={mobileConfirm} onClose={() => setMobileConfirm(null)} />
    </div>
  );
}
