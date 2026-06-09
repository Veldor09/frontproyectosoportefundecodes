"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User, Mail, Calendar, Globe, Building2,
  CheckCircle, Plus, Trash2, Users, Info,
} from "lucide-react";
import { Voluntario } from "../types/voluntario";

interface Props {
  initial?: Voluntario;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

// ─── Single mode ──────────────────────────────────────────────
type SingleFormValues = {
  nombre: string;
  email: string;
  nacionalidad: string;
  fechaEntrada: string;
  fechaSalida: string;
  ong: string;
};

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

// ─── Bulk mode ────────────────────────────────────────────────
type BulkRow = { id: string; nombre: string; email: string; nacionalidad: string };
type BulkShared = { fechaEntrada: string; fechaSalida: string; ong: string };

export default function VoluntarioForm({ initial, onSave, onCancel }: Props) {
  const isEdit = Boolean(initial);
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // ── Single form (react-hook-form) ────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SingleFormValues>({
    defaultValues: {
      nombre: initial?.nombre ?? "",
      email: initial?.email ?? "",
      nacionalidad: initial?.nacionalidad ?? "",
      fechaEntrada: toDateInput(initial?.fechaEntrada),
      fechaSalida: toDateInput(initial?.fechaSalida),
      ong: initial?.ong ?? "",
    },
  });

  const onSubmitSingle = async (data: SingleFormValues) => {
    try {
      const dto = {
        ...(initial?.id ? { id: initial.id } : {}),
        nombre: data.nombre.trim(),
        email: data.email.trim() || null,
        nacionalidad: data.nacionalidad.trim() || null,
        fechaEntrada: new Date(data.fechaEntrada).toISOString(),
        fechaSalida: data.fechaSalida ? new Date(data.fechaSalida).toISOString() : null,
        ong: data.ong.trim() || null,
      };
      await onSave(dto);
      toast.success(initial ? "Voluntario actualizado" : "Voluntario creado");
      onCancel();
    } catch {
      toast.error("Error al guardar el voluntario");
    }
  };

  // ── Bulk state ───────────────────────────────────────────────
  const rowCounter = useRef(0);
  const newId = () => `row-${++rowCounter.current}`;

  const [shared, setShared] = useState<BulkShared>({ fechaEntrada: "", fechaSalida: "", ong: "" });
  const [rows, setRows] = useState<BulkRow[]>([
    { id: newId(), nombre: "", email: "", nacionalidad: "" },
    { id: newId(), nombre: "", email: "", nacionalidad: "" },
  ]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [sharedError, setSharedError] = useState("");
  const [saving, setSaving] = useState(false);

  const addRow = () =>
    setRows(prev => [...prev, { id: newId(), nombre: "", email: "", nacionalidad: "" }]);

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
    setRowErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const updateRow = (id: string, field: keyof Omit<BulkRow, "id">, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    if (field === "nombre") {
      setRowErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const filledCount = rows.filter(r => r.nombre.trim()).length;

  const validateBulk = (): boolean => {
    if (!shared.fechaEntrada) {
      setSharedError("La fecha de entrada es obligatoria");
      return false;
    }
    setSharedError("");

    const errs: Record<string, string> = {};
    rows.forEach(r => {
      if (!r.nombre.trim()) {
        errs[r.id] = "El nombre es obligatorio";
      } else if (r.email.trim() && !/\S+@\S+\.\S+/.test(r.email.trim())) {
        errs[r.id] = "Email inválido";
      }
    });
    setRowErrors(errs);

    if (filledCount === 0) {
      toast.error("Ingrese al menos un nombre");
      return false;
    }
    return Object.keys(errs).length === 0;
  };

  const onSubmitBulk = async () => {
    if (!validateBulk()) return;
    setSaving(true);

    const validRows = rows.filter(r => r.nombre.trim());
    let ok = 0, fail = 0;

    for (const row of validRows) {
      try {
        await onSave({
          nombre: row.nombre.trim(),
          email: row.email.trim() || null,
          nacionalidad: row.nacionalidad.trim() || null,
          fechaEntrada: new Date(shared.fechaEntrada).toISOString(),
          fechaSalida: shared.fechaSalida ? new Date(shared.fechaSalida).toISOString() : null,
          ong: shared.ong.trim() || null,
        });
        ok++;
      } catch {
        fail++;
      }
    }

    setSaving(false);

    if (fail === 0) {
      toast.success(
        `${ok} voluntario${ok !== 1 ? "s" : ""} registrado${ok !== 1 ? "s" : ""} exitosamente`
      );
      onCancel();
    } else if (ok === 0) {
      toast.error("No se pudo registrar ningún voluntario");
    } else {
      toast.warning(`${ok} registrado${ok !== 1 ? "s" : ""}, ${fail} fallaron`);
      onCancel();
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Mode toggle — only in create mode */}
      {!isEdit && (
        <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 w-fit">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "single"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Individual
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "bulk"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Masivo
          </button>
        </div>
      )}

      {/* ══════════════ SINGLE MODE ══════════════ */}
      {mode === "single" && (
        <form onSubmit={handleSubmit(onSubmitSingle)} className="space-y-4">

          {/* Nombre */}
          <div>
            <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1">
              <User className="h-4 w-4" /> Nombre completo *
            </Label>
            <Input
              placeholder="Ej. María García López"
              {...register("nombre", { required: "El nombre es obligatorio" })}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          {/* Email */}
          <div>
            <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1">
              <Mail className="h-4 w-4" /> Correo electrónico
            </Label>
            <Input
              type="email"
              placeholder="voluntario@correo.com"
              {...register("email", {
                pattern: { value: /\S+@\S+\.\S+/, message: "Email inválido" },
              })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Nacionalidad */}
          <div>
            <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1">
              <Globe className="h-4 w-4" /> Nacionalidad
            </Label>
            <Input placeholder="Ej. Costa Rica" {...register("nacionalidad")} />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1">
                <Calendar className="h-4 w-4" /> Fecha de entrada *
              </Label>
              <Input
                type="date"
                {...register("fechaEntrada", { required: "La fecha de entrada es obligatoria" })}
              />
              {errors.fechaEntrada && <p className="text-red-500 text-xs mt-1">{errors.fechaEntrada.message}</p>}
            </div>
            <div>
              <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1">
                <Calendar className="h-4 w-4" /> Fecha de salida
              </Label>
              <Input type="date" {...register("fechaSalida")} />
              <p className="text-xs text-slate-400 mt-1">El voluntario se elimina automáticamente al día siguiente.</p>
            </div>
          </div>

          {/* ONG */}
          <div>
            <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1">
              <Building2 className="h-4 w-4" /> ONG / Organización de origen
            </Label>
            <Input placeholder="(opcional)" {...register("ong")} />
            <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0 text-slate-400" />
              Esta ONG es la misma empresa que aparecerá como intermediaria al asignar a programas.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <CheckCircle className="h-4 w-4" />
              {initial ? "Actualizar" : "Crear"} voluntario
            </Button>
          </div>
        </form>
      )}

      {/* ══════════════ BULK MODE ══════════════ */}
      {mode === "bulk" && (
        <div className="space-y-5">

          {/* Shared data card */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datos compartidos del grupo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1 text-sm">
                  <Calendar className="h-3.5 w-3.5" /> Fecha de entrada *
                </Label>
                <Input
                  type="date"
                  value={shared.fechaEntrada}
                  onChange={e => {
                    setShared(p => ({ ...p, fechaEntrada: e.target.value }));
                    setSharedError("");
                  }}
                  className={sharedError ? "border-red-400" : ""}
                />
                {sharedError && <p className="text-red-500 text-xs mt-1">{sharedError}</p>}
              </div>
              <div>
                <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1 text-sm">
                  <Calendar className="h-3.5 w-3.5" /> Fecha de salida
                </Label>
                <Input
                  type="date"
                  value={shared.fechaSalida}
                  min={shared.fechaEntrada || undefined}
                  onChange={e => setShared(p => ({ ...p, fechaSalida: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">El voluntario se elimina automáticamente al día siguiente.</p>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 text-slate-700 font-medium pb-1 text-sm">
                <Building2 className="h-3.5 w-3.5" /> ONG / Organización de origen
              </Label>
              <Input
                placeholder="(opcional)"
                value={shared.ong}
                onChange={e => setShared(p => ({ ...p, ong: e.target.value }))}
              />
              <p className="text-xs text-blue-600 mt-1.5 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Esta es la misma empresa que aparecerá como intermediaria al asignar estos voluntarios a programas.
              </p>
            </div>
          </div>

          {/* Volunteer rows */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Voluntarios
                <span className="text-slate-400 font-normal">
                  ({filledCount} con nombre ingresado)
                </span>
              </h3>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 px-1 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre *</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Correo</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nacionalidad</span>
              <span />
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {rows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 items-start">
                  <div>
                    <Input
                      placeholder={`Voluntario ${idx + 1}`}
                      value={row.nombre}
                      onChange={e => updateRow(row.id, "nombre", e.target.value)}
                      className={rowErrors[row.id] ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {rowErrors[row.id] && (
                      <p className="text-red-500 text-xs mt-0.5">{rowErrors[row.id]}</p>
                    )}
                  </div>

                  <Input
                    placeholder="correo@ejemplo.com"
                    value={row.email}
                    onChange={e => updateRow(row.id, "email", e.target.value)}
                  />

                  <Input
                    placeholder="Ej. Costa Rica"
                    value={row.nacionalidad}
                    onChange={e => updateRow(row.id, "nacionalidad", e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    className="mt-0.5 h-9 w-8 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Eliminar fila"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add row button */}
            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar voluntario
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSubmitBulk}
              disabled={saving || filledCount === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {saving
                ? "Guardando..."
                : `Registrar ${filledCount} voluntario${filledCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
