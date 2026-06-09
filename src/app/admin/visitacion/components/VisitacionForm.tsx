"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Visitacion, VisitacionCreateInput } from "../types/visitacion";

interface Props {
  open: boolean;
  initial?: Visitacion | null;
  onClose: () => void;
  onSave: (payload: VisitacionCreateInput & { id?: number }) => Promise<unknown>;
}

const EMPTY: VisitacionCreateInput = {
  fecha: "",
  totalPersonas: 0,
  nacionales: 0,
  notas: "",
};

export default function VisitacionForm({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<VisitacionCreateInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        fecha: initial.fecha?.slice(0, 10) ?? "",
        totalPersonas: initial.totalPersonas ?? 0,
        nacionales: initial.nacionales ?? 0,
        notas: initial.notas ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  const extranjeros = Math.max(0, (form.totalPersonas ?? 0) - (form.nacionales ?? 0));

  function setNum(field: "totalPersonas" | "nacionales", raw: string) {
    const n = Math.max(0, parseInt(raw, 10) || 0);
    setForm((prev) => ({ ...prev, [field]: n }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fecha) { setError("La fecha es requerida."); return; }
    if (form.nacionales > form.totalPersonas) {
      setError("Los nacionales no pueden superar el total de personas.");
      return;
    }

    setLoading(true);
    try {
      await onSave({ ...form, ...(initial ? { id: initial.id } : {}) });
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {isEdit ? "Editar registro de visita" : "Nuevo registro de visita"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div>
            <Label htmlFor="v-fecha">Fecha *</Label>
            <Input
              id="v-fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
              required
            />
          </div>

          {/* Total personas */}
          <div>
            <Label htmlFor="v-total">Total de personas *</Label>
            <Input
              id="v-total"
              type="number"
              min={0}
              value={form.totalPersonas}
              onChange={(e) => setNum("totalPersonas", e.target.value)}
              required
            />
          </div>

          {/* Nacionales */}
          <div>
            <Label htmlFor="v-nacionales">Nacionales *</Label>
            <Input
              id="v-nacionales"
              type="number"
              min={0}
              max={form.totalPersonas}
              value={form.nacionales}
              onChange={(e) => setNum("nacionales", e.target.value)}
              required
            />
          </div>

          {/* Extranjeros — calculado */}
          <div>
            <Label>Extranjeros (calculado)</Label>
            <div className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 items-center">
              {extranjeros}
            </div>
            {form.nacionales > form.totalPersonas && (
              <p className="text-xs text-amber-600 mt-1">
                Los nacionales superan el total — ajusta los valores.
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="v-notas">Notas (opcional)</Label>
            <textarea
              id="v-notas"
              rows={3}
              value={form.notas ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar visita"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
