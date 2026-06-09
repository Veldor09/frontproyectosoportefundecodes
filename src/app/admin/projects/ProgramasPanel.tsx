"use client";

import { useEffect, useRef, useState } from "react";
import { listAreasSelector, type AreaSelector } from "@/services/areas.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/Modal";
import { ImageIcon, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useProgramaVoluntariadoCrud } from "@/app/admin/voluntariado/hooks/useProgramaVoluntariadoCrud";
import ExportButton from "@/app/admin/_components/ExportButton";
import type { ExportRow } from "@/lib/export";
import { resolveMediaUrl } from "@/lib/media-url";
import ConfirmModal, { type ConfirmState } from "@/components/ui/ConfirmModal";

/* ── Estilos de botón estándar ────────────────────────────── */
const BTN_EDIT   = "bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors";
const BTN_DELETE = "bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors";

const PROG_COLS = [
  { key: "nombre",        header: "Nombre",          width: 26 },
  { key: "lugar",         header: "Área/Lugar",       width: 20 },
  { key: "limite",        header: "Límite",           width: 10 },
  { key: "participantes", header: "Participantes",    width: 14 },
  { key: "descripcion",   header: "Descripción",      width: 36 },
];

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

async function uploadProgramaImagen(file: File): Promise<{ url: string; key: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/files/upload?folder=programs`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al subir imagen");
  }
  return res.json();
}

type FormState = {
  id?: string | number;
  nombre: string;
  lugar: string;
  descripcion: string;
  limiteParticipantes: string;
  imagenUrl: string;
  imagenKey: string;
};

export default function ProgramasPanel() {
  const { data, loading, create, update, remove } = useProgramaVoluntariadoCrud();
  const programas = Array.isArray(data) ? data : [];

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [uploadingImagen, setUploadingImagen] = useState(false);
  const imagenInputRef = useRef<HTMLInputElement>(null);

  const [areas, setAreas] = useState<AreaSelector[]>([]);
  useEffect(() => {
    listAreasSelector().then(setAreas).catch(() => {});
  }, []);

  const [form, setForm] = useState<FormState>({
    nombre: "", lugar: "", descripcion: "", limiteParticipantes: "0", imagenUrl: "", imagenKey: "",
  });

  const editing = Boolean(form.id);

  function openCreate() {
    setForm({ nombre: "", lugar: "", descripcion: "", limiteParticipantes: "0", imagenUrl: "", imagenKey: "" });
    setOpen(true);
  }

  function openEdit(p: any) {
    setForm({
      id: p.id,
      nombre: p.nombre ?? "",
      lugar: p.lugar ?? "",
      descripcion: p.descripcion ?? "",
      limiteParticipantes: String(p.limiteParticipantes ?? 0),
      imagenUrl: p.imagenUrl ?? "",
      imagenKey: p.imagenKey ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return toast.error("El nombre es requerido");
    if (!form.lugar.trim()) return toast.error("Selecciona un área");
    const limite = Number(form.limiteParticipantes);
    if (!Number.isFinite(limite) || limite < 0) return toast.error("Límite inválido");

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        lugar: form.lugar.trim(),
        descripcion: form.descripcion?.trim() || "",
        limiteParticipantes: limite,
        ...(form.imagenUrl ? { imagenUrl: form.imagenUrl, imagenKey: form.imagenKey || undefined } : {}),
      };
      if (editing) {
        await update(form.id!, payload);
        toast.success("Programa actualizado");
      } else {
        await create(payload);
        toast.success("Programa creado");
      }
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string | number) {
    setConfirmState({
      title: "Eliminar programa",
      message: "¿Seguro que deseas eliminar este programa? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await remove(id);
          toast.success("Programa eliminado");
        } catch {
          toast.error("No se pudo eliminar");
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Programas</h2>
          <p className="text-sm text-slate-500">Crea y administra programas para luego asignar voluntarios.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            title="Programas de Voluntariado"
            subtitle="Listado de programas activos"
            filename="programas"
            columns={PROG_COLS}
            currentRows={programas.map((p: any) => ({
              nombre:        p.nombre ?? "",
              lugar:         p.lugar ?? "",
              limite:        p.limiteParticipantes ?? 0,
              participantes: p._count?.asignaciones ?? p.asignaciones?.length ?? 0,
              descripcion:   p.descripcion ?? "",
            } as ExportRow))}
            fetchAll={async () => programas.map((p: any) => ({
              nombre:        p.nombre ?? "",
              lugar:         p.lugar ?? "",
              limite:        p.limiteParticipantes ?? 0,
              participantes: p._count?.asignaciones ?? p.asignaciones?.length ?? 0,
              descripcion:   p.descripcion ?? "",
            } as ExportRow))}
          />
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreate}>
            + Nuevo programa
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : programas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <Users className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No hay programas todavía.</p>
          <p className="text-slate-400 text-sm mt-1">Crea el primero con el botón "Nuevo programa".</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programas.map((p: any) => {
            const asignados = Array.isArray(p?.voluntarios) ? p.voluntarios.length : (p._count?.asignaciones ?? 0);
            const limite    = Number(p?.limiteParticipantes ?? 0);
            const sinLimite = limite === 0;
            const disponibles = sinLimite ? null : Math.max(limite - asignados, 0);
            const lleno = !sinLimite && asignados >= limite;
            const imgUrl = resolveMediaUrl(p.imagenUrl);

            return (
              <div
                key={p.id}
                className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Imagen */}
                <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl}
                      alt={p.nombre}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="h-full w-full items-center justify-center"
                    style={{ display: imgUrl ? "none" : "flex" }}
                  >
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  {/* Participantes badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                      lleno
                        ? "bg-red-100/90 text-red-700 border-red-200"
                        : sinLimite
                        ? "bg-blue-100/90 text-blue-700 border-blue-200"
                        : "bg-emerald-100/90 text-emerald-700 border-emerald-200"
                    }`}>
                      <Users className="w-3 h-3" />
                      {sinLimite ? `${asignados} inscritos` : `${asignados}/${limite}`}
                      {!sinLimite && ` · ${disponibles} disponibles`}
                    </span>
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-semibold text-slate-800 text-base leading-snug mb-1.5 group-hover:text-blue-700 transition-colors">
                    {p.nombre}
                  </h3>

                  {p.lugar && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <MapPin className="w-3 h-3" /> {p.lugar}
                    </span>
                  )}

                  {p.descripcion && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                      {p.descripcion}
                    </p>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
                    <button onClick={() => openEdit(p)} className={`flex-1 ${BTN_EDIT}`}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(p.id)} className={`flex-1 ${BTN_DELETE}`}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-xl font-bold mb-4">{editing ? "Editar programa" : "Nuevo programa"}</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value.slice(0, 150) })}
              maxLength={150}
              placeholder="Nombre del programa"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.nombre.length}/150</p>
          </div>
          <div>
            <Label htmlFor="lugar">Área *</Label>
            <select
              id="lugar"
              value={form.lugar}
              onChange={(e) => setForm({ ...form, lugar: e.target.value })}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">— Selecciona un área —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.nombre}>{a.nombre}</option>
              ))}
            </select>
            {areas.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No hay áreas creadas. Ve a la pestaña Áreas primero.</p>
            )}
          </div>
          <div>
            <Label htmlFor="desc">Descripción</Label>
            <textarea
              id="desc"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value.slice(0, 1000) })}
              maxLength={1000}
              rows={4}
              placeholder="Descripción del programa (opcional)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{(form.descripcion ?? "").length}/1000</p>
          </div>
          <div>
            <Label htmlFor="limite">Límite de participantes (0 = sin límite)</Label>
            <Input
              id="limite"
              type="number"
              min="0"
              value={form.limiteParticipantes}
              onChange={(e) => setForm({ ...form, limiteParticipantes: e.target.value })}
            />
          </div>

          {/* Imagen */}
          <div>
            <Label>Imagen del programa (opcional)</Label>
            {form.imagenUrl && (
              <div className="relative mt-1 mb-2 w-full h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(form.imagenUrl) ?? form.imagenUrl}
                  alt="Imagen"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imagenUrl: "", imagenKey: "" })}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow text-slate-600 hover:text-red-600"
                  title="Quitar imagen"
                >✕</button>
              </div>
            )}
            <input
              ref={imagenInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5 MB"); return; }
                setUploadingImagen(true);
                try {
                  const { url, key } = await uploadProgramaImagen(file);
                  setForm((f) => ({ ...f, imagenUrl: url, imagenKey: key }));
                  toast.success("Imagen subida");
                } catch (err: any) {
                  toast.error(err?.message ?? "Error al subir imagen");
                } finally {
                  setUploadingImagen(false);
                  if (imagenInputRef.current) imagenInputRef.current.value = "";
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingImagen}
              onClick={() => imagenInputRef.current?.click()}
              className="mt-1 gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {uploadingImagen ? "Subiendo…" : "Subir imagen"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || uploadingImagen} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear programa"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
