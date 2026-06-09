// src/components/SancionForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, Calendar, FileText, CheckCircle, User } from "lucide-react";
import type { Sancion, SancionTipo } from "../types/sancion";
import type { Voluntario } from "../types/voluntario";
import { useVoluntarios } from "../hooks/useVoluntarios";

const TIPOS_SANCION: readonly SancionTipo[] = [
  "LEVE",
  "GRAVE",
  "MUY_GRAVE",
  "EXTREMADAMENTE_GRAVE",
] as const;

/** Límites de longitud solicitados */
const MAX_MOTIVO = 30;        // 20–30 -> usamos 30
const MAX_DESCRIPCION = 100;  // 80–100 -> usamos 100
const MAX_CREADA_POR = 50;    // ~50

interface Props {
  initial?: Sancion;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  voluntarioPreseleccionado?: Voluntario;
}

type FormValues = {
  voluntarioId: number;
  tipo: SancionTipo | "";
  motivo: string;
  descripcion?: string;
  fechaInicio: string;       // yyyy-MM-dd
  fechaVencimiento?: string; // yyyy-MM-dd
  creadaPor?: string;
  esPermanente: boolean;
};

export default function SancionForm({
  initial,
  onSave,
  onCancel,
  voluntarioPreseleccionado,
}: Props) {
  const { data: voluntarios } = useVoluntarios();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: initial
      ? {
          voluntarioId: initial.voluntarioId,
          tipo: initial.tipo,
          motivo: initial.motivo ?? "",
          descripcion: initial.descripcion || "",
          fechaInicio: initial.fechaInicio
            ? new Date(initial.fechaInicio).toISOString().slice(0, 10)
            : "",
          fechaVencimiento: initial.fechaVencimiento
            ? new Date(initial.fechaVencimiento).toISOString().slice(0, 10)
            : "",
          creadaPor: initial.creadaPor || "",
          esPermanente: !initial.fechaVencimiento,
        }
      : {
          voluntarioId: voluntarioPreseleccionado?.id || 0,
          tipo: "",
          motivo: "",
          descripcion: "",
          fechaInicio: new Date().toISOString().slice(0, 10),
          fechaVencimiento: "",
          creadaPor: "",
          esPermanente: false,
        },
  });

  const esPermanente = watch("esPermanente");

  // Para contadores en UI
  const motivoVal = watch("motivo") ?? "";
  const descVal = watch("descripcion") ?? "";
  const creadaPorVal = watch("creadaPor") ?? "";

  useEffect(() => {
    if (voluntarioPreseleccionado) {
      setValue("voluntarioId", voluntarioPreseleccionado.id);
    }
  }, [voluntarioPreseleccionado, setValue]);

  // Limitar pegado a un máximo de caracteres
  function limitPaste(
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof FormValues,
    max: number
  ) {
    const pasted = e.clipboardData.getData("text") ?? "";
    const current = (watch(field) as string) ?? "";
    const selection = window.getSelection?.();
    let selectionLen = 0;

    // Intento de calcular selección (no crítico si falla)
    try {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (typeof target.selectionStart === "number" && typeof target.selectionEnd === "number") {
        selectionLen = Math.max(0, target.selectionEnd - target.selectionStart);
      } else if (selection && selection.toString()) {
        selectionLen = selection.toString().length;
      }
    } catch {}

    // Longitud resultante si pegamos completo
    const resulting = current.length - selectionLen + pasted.length;
    if (resulting > max) {
      e.preventDefault();
      const room = Math.max(0, max - (current.length - selectionLen));
      const clipped = pasted.slice(0, room);
      const valueAfter = (() => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (typeof target.selectionStart === "number" && typeof target.selectionEnd === "number") {
          const before = current.slice(0, target.selectionStart);
          const after = current.slice(target.selectionEnd);
          return before + clipped + after;
        }
        return (current + clipped).slice(0, max);
      })();
      setValue(field, valueAfter as any, { shouldValidate: true, shouldDirty: true });
    }
  }

  const onSubmit = async (data: FormValues) => {
    try {
      if (!data.tipo) {
        toast.error("Debe seleccionar un tipo de sanción");
        return;
      }
      const dto = {
        voluntarioId: data.voluntarioId,
        tipo: data.tipo as SancionTipo,
        motivo: data.motivo.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        fechaInicio: new Date(data.fechaInicio).toISOString(),
        fechaVencimiento: data.esPermanente
          ? null
          : data.fechaVencimiento
          ? new Date(data.fechaVencimiento).toISOString()
          : null,
        creadaPor: (data.creadaPor || "Sistema").trim(),
      };

      await onSave(dto);
      toast.success(initial ? "Sanción actualizada" : "Sanción registrada");
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la sanción");
    }
  };

  const voluntarioSeleccionado = voluntarios.find(
    (v) => v.id === watch("voluntarioId")
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Voluntario */}
      <div>
        <Label className="text-slate-700 flex items-center gap-2">
          <User className="h-4 w-4" />
          Voluntario *
        </Label>
        {voluntarioPreseleccionado ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-medium text-blue-900">
              {voluntarioPreseleccionado.nombre}
            </p>
            <p className="text-sm text-blue-700">
              {voluntarioPreseleccionado.email ?? voluntarioPreseleccionado.nacionalidad ?? "—"}
            </p>
          </div>
        ) : (
          <>
            <select
              className="w-full border rounded-md h-10 px-2 text-sm"
              {...register("voluntarioId", {
                required: "Debe seleccionar un voluntario",
                min: { value: 1, message: "Debe seleccionar un voluntario válido" },
              })}
            >
              <option value={0}>Seleccione un voluntario</option>
              {voluntarios.map((vol) => (
                <option key={vol.id} value={vol.id}>
                  {vol.nombre}{vol.nacionalidad ? ` (${vol.nacionalidad})` : ""}
                </option>
              ))}
            </select>
            {errors.voluntarioId && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.voluntarioId.message)}
              </p>
            )}
          </>
        )}
      </div>

      {/* Tipo */}
      <div>
        <Label className="text-slate-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Tipo de Sanción *
        </Label>
        <select
          className="w-full border rounded-md h-10 px-2 text-sm"
          {...register("tipo", { required: "Debe seleccionar un tipo de sanción" })}
        >
          <option value="">Seleccione el tipo de sanción</option>
          {TIPOS_SANCION.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {errors.tipo && (
          <p className="text-red-500 text-xs mt-1">{String(errors.tipo.message)}</p>
        )}
      </div>

      {/* Motivo */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-slate-700 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Motivo *
          </Label>
          <span className="text-xs text-slate-500">
            {motivoVal.length}/{MAX_MOTIVO}
          </span>
        </div>
        <Input
          placeholder="Indique el motivo de la sanción"
          maxLength={MAX_MOTIVO}
          onPaste={(e) => limitPaste(e, "motivo", MAX_MOTIVO)}
          {...register("motivo", {
            required: "El motivo es requerido",
            minLength: { value: 2, message: "Muy corto" },
            maxLength: { value: MAX_MOTIVO, message: `Máximo ${MAX_MOTIVO} caracteres` },
          })}
        />
        {errors.motivo && (
          <p className="text-red-500 text-xs mt-1">{String(errors.motivo.message)}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-slate-700">Descripción Detallada</Label>
          <span className="text-xs text-slate-500">
            {descVal.length}/{MAX_DESCRIPCION}
          </span>
        </div>
        <Textarea
          placeholder="Proporcione detalles adicionales sobre la sanción..."
          rows={3}
          maxLength={MAX_DESCRIPCION}
          onPaste={(e) => limitPaste(e as React.ClipboardEvent<HTMLTextAreaElement>, "descripcion", MAX_DESCRIPCION)}
          {...register("descripcion", {
            maxLength: { value: MAX_DESCRIPCION, message: `Máximo ${MAX_DESCRIPCION} caracteres` },
          })}
        />
        {errors.descripcion && (
          <p className="text-red-500 text-xs mt-1">{String(errors.descripcion.message)}</p>
        )}
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fecha de Inicio *
          </Label>
          <Input
            type="date"
            {...register("fechaInicio", { required: "La fecha de inicio es requerida" })}
          />
          {errors.fechaInicio && (
            <p className="text-red-500 text-xs mt-1">{String(errors.fechaInicio.message)}</p>
          )}
        </div>

        <div>
          <Label className="text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fecha de Vencimiento
          </Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPermanente"
                {...register("esPermanente")}
                className="rounded"
              />
              <label htmlFor="esPermanente" className="text-sm text-slate-600">
                Sanción permanente (sin fecha de vencimiento)
              </label>
            </div>
            {!esPermanente && (
              <Input type="date" {...register("fechaVencimiento")} min={watch("fechaInicio")} />
            )}
          </div>
        </div>
      </div>

      {/* Creada por */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-slate-700">Sanción aplicada por</Label>
          <span className="text-xs text-slate-500">
            {creadaPorVal.length}/{MAX_CREADA_POR}
          </span>
        </div>
        <Input
          placeholder="Nombre de quien aplica la sanción"
          maxLength={MAX_CREADA_POR}
          onPaste={(e) => limitPaste(e, "creadaPor", MAX_CREADA_POR)}
          {...register("creadaPor", {
            maxLength: { value: MAX_CREADA_POR, message: `Máximo ${MAX_CREADA_POR} caracteres` },
          })}
        />
        {errors.creadaPor && (
          <p className="text-red-500 text-xs mt-1">{String(errors.creadaPor.message)}</p>
        )}
      </div>

      {/* Info voluntario */}
      {voluntarioSeleccionado && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
          <h4 className="font-medium text-slate-800 mb-2">Información del Voluntario</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
            <div>
              <strong>Nombre:</strong> {voluntarioSeleccionado.nombre}
            </div>
            <div>
              <strong>Nacionalidad:</strong> {voluntarioSeleccionado.nacionalidad ?? "—"}
            </div>
            <div>
              <strong>Email:</strong> {voluntarioSeleccionado.email ?? "—"}
            </div>
            <div>
              <strong>ONG:</strong> {voluntarioSeleccionado.ong ?? "—"}
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <CheckCircle className="h-4 w-4" />
          {initial ? "Actualizar" : "Registrar"} Sanción
        </Button>
      </div>
    </form>
  );
}
