"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, ArchiveRestore, Archive, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/ui/Modal";
import ConfirmModal, { type ConfirmState } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import {
  listAreas,
  createArea,
  updateArea,
  archiveArea,
  restoreArea,
  deleteArea,
} from "@/services/areas.service";
import type { Area } from "@/services/areas.service";

type FormState = {
  id?: number;
  nombre: string;
  descripcion: string;
};

const EMPTY_FORM: FormState = { nombre: "", descripcion: "" };

export default function AreasPanel() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const editing = Boolean(form.id);

  const load = useCallback(
    async (pg = page) => {
      setLoading(true);
      try {
        const res = await listAreas({ q: q || undefined, page: pg, pageSize });
        setAreas(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch {
        toast.error("No se pudieron cargar las áreas");
      } finally {
        setLoading(false);
      }
    },
    [q, page, pageSize]
  );

  useEffect(() => {
    load(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(a: Area) {
    setForm({ id: a.id, nombre: a.nombre, descripcion: a.descripcion ?? "" });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return toast.error("El nombre del área es obligatorio");

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      };
      if (editing && form.id) {
        await updateArea(form.id, payload);
        toast.success("Área actualizada");
      } else {
        await createArea(payload);
        toast.success("Área creada");
      }
      setOpen(false);
      load(editing ? page : 1);
    } catch {
      toast.error("No se pudo guardar el área");
    } finally {
      setSaving(false);
    }
  }

  function handleArchive(a: Area) {
    setConfirmState({
      title: "Archivar área",
      message: `¿Archivar el área "${a.nombre}"? Quedará inactiva pero no se eliminará.`,
      confirmLabel: "Archivar",
      variant: "warning",
      onConfirm: async () => {
        try {
          await archiveArea(a.id);
          toast.success("Área archivada");
          load(page);
        } catch {
          toast.error("No se pudo archivar el área");
        }
      },
    });
  }

  async function handleRestore(a: Area) {
    try {
      await restoreArea(a.id);
      toast.success("Área reactivada");
      load(page);
    } catch {
      toast.error("No se pudo reactivar el área");
    }
  }

  function handleDelete(a: Area) {
    setConfirmState({
      title: "Eliminar área",
      message: `¿Eliminar el área "${a.nombre}"? Se desvincularán todos sus proyectos, programas y colaboradores.`,
      confirmLabel: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteArea(a.id);
          toast.success("Área eliminada");
          load(1);
          setPage(1);
        } catch {
          toast.error("No se pudo eliminar el área");
        }
      },
    });
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Áreas</h2>
          <p className="text-sm text-slate-500">
            Agrupa proyectos, programas, cuentas y colaboradores externos por área de trabajo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => load(page)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Recargar
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Nueva área
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="max-w-xs">
        <Input
          placeholder="Buscar área…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-slate-400 py-6 text-center">Cargando áreas…</p>
      ) : areas.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No se encontraron áreas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nombre</th>
                <th className="px-4 py-2 text-left font-medium">Descripción</th>
                <th className="px-4 py-2 text-center font-medium">Proyectos</th>
                <th className="px-4 py-2 text-center font-medium">Programas</th>
                <th className="px-4 py-2 text-center font-medium">Colaboradores</th>
                <th className="px-4 py-2 text-center font-medium">Cuenta</th>
                <th className="px-4 py-2 text-center font-medium">Estado</th>
                <th className="px-4 py-2 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {areas.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-slate-800">{a.nombre}</td>
                  <td className="px-4 py-2 text-slate-500 max-w-xs truncate">
                    {a.descripcion ?? <span className="italic text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">
                    {a._count?.proyectos ?? 0}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">
                    {a._count?.programas ?? 0}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">
                    {a._count?.colaboradores ?? 0}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600 text-xs">
                    {a.cuenta ? (
                      <span className="text-blue-600 font-medium">{a.cuenta.nombre}</span>
                    ) : (
                      <span className="italic text-slate-300">Sin cuenta</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge
                      className={
                        a.activa
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }
                    >
                      {a.activa ? "Activa" : "Archivada"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(a)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                        Editar
                      </button>
                      {a.activa ? (
                        <button onClick={() => handleArchive(a)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                          Archivar
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(a)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                          Reactivar
                        </button>
                      )}
                      <button onClick={() => handleDelete(a)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages} ({total} áreas)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente →
          </Button>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-5 min-w-[320px]">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? "Editar área" : "Nueva área"}
          </h2>

          <div className="space-y-1">
            <Label htmlFor="area-nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="area-nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Área Educativa"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="area-desc">Descripción</Label>
            <textarea
              id="area-desc"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción del área (opcional)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear área"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
