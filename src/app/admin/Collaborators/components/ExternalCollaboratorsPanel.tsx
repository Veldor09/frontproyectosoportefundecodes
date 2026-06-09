"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/ui/Modal";
import ConfirmModal, { type ConfirmState } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import {
  apiListExternalCollaborators,
  apiCreateExternalCollaborator,
  apiUpdateExternalCollaborator,
  apiDeleteExternalCollaborator,
} from "../services/collaborators.api";
import { listAreasSelector } from "@/services/areas.service";
import type { AreaSelector } from "@/services/areas.service";

type ExternalRol =
  | "colaboradorsolicitante"
  | "colaboradorvoluntariadoexterno";

interface ExternalColaborador {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  rol: ExternalRol;
  estado: string;
  areaId?: number | null;
  areaOrg?: { id: number; nombre: string } | null;
}

type FormState = {
  id?: number;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: ExternalRol;
  areaId: string;
};

const EMPTY_FORM: FormState = {
  nombreCompleto: "",
  correo: "",
  telefono: "+506",
  rol: "colaboradorsolicitante",
  areaId: "",
};

const ROL_LABELS: Record<ExternalRol, string> = {
  colaboradorsolicitante: "Solicitante",
  colaboradorvoluntariadoexterno: "Vol. Externo",
};

export default function ExternalCollaboratorsPanel() {
  const [items, setItems] = useState<ExternalColaborador[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [areas, setAreas] = useState<AreaSelector[]>([]);
  const [phoneCountry, setPhoneCountry] = useState<string>("CR");

  const editing = Boolean(form.id);

  /* ── Helpers de teléfono (igual que AddCollaboratorModal) ── */
  function getMaxNationalLength(c?: string): number {
    if (!c) return 15;
    try {
      const ex = getExampleNumber(c as any, examples as any);
      if (ex?.nationalNumber) return String(ex.nationalNumber).length;
    } catch {}
    const fb: Record<string, number> = {
      CR: 8, US: 10, CA: 10, MX: 10, ES: 9, AR: 10, CL: 9, CO: 10,
      PE: 9, BR: 11, EC: 9, PA: 8, NI: 8, HN: 8, SV: 8, GT: 8, DO: 10, PR: 10,
    };
    return fb[c] ?? 15;
  }

  function handlePhoneChange(value?: string) {
    const c = phoneCountry || "CR";
    try {
      const cc = getCountryCallingCode(c as any);
      const digits = (value || "").replace(/\D/g, "");
      const maxNat = getMaxNationalLength(c);
      let nat = digits.slice(String(cc).length);
      if (nat.length > maxNat) nat = nat.slice(0, maxNat);
      setForm((f) => ({ ...f, telefono: `+${cc}${nat}` }));
    } catch {
      setForm((f) => ({ ...f, telefono: value ?? f.telefono }));
    }
  }

  function handlePhoneCountryChange(c?: string) {
    const next = c || "CR";
    setPhoneCountry(next);
    try {
      const cc = getCountryCallingCode(next as any);
      setForm((f) => ({ ...f, telefono: `+${cc}` }));
    } catch {
      setForm((f) => ({ ...f, telefono: "" }));
    }
  }

  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key;
    if (!/^\d$/.test(key)) return;
    const input = e.currentTarget;
    const val = input.value ?? "";
    try {
      const cc = getCountryCallingCode((phoneCountry as any) || "CR");
      const ccLen = String(cc).length;
      const selStart = input.selectionStart ?? val.length;
      const selEnd = input.selectionEnd ?? val.length;
      const replacing = selStart !== selEnd;
      const digitsAll = val.replace(/\D/g, "");
      const natLen = Math.max(0, digitsAll.length - ccLen);
      const maxNat = getMaxNationalLength(phoneCountry);
      if (natLen >= maxNat && !replacing) e.preventDefault();
    } catch {}
  }

  const load = useCallback(
    async (pg = page) => {
      setLoading(true);
      try {
        const res = await apiListExternalCollaborators({
          q: q || undefined,
          page: pg,
          pageSize,
        });
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch {
        toast.error("No se pudieron cargar los colaboradores externos");
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

  useEffect(() => {
    listAreasSelector().then(setAreas).catch(() => {});
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setPhoneCountry("CR");
    setOpen(true);
  }

  function openEdit(c: ExternalColaborador) {
    const tel = c.telefono ?? "+506";
    // Intentar detectar el país del teléfono guardado
    try {
      const parsed = parsePhoneNumberFromString(tel);
      if (parsed?.country) setPhoneCountry(parsed.country);
      else setPhoneCountry("CR");
    } catch {
      setPhoneCountry("CR");
    }
    setForm({
      id: c.id,
      nombreCompleto: c.nombreCompleto,
      correo: c.correo,
      telefono: tel,
      rol: c.rol,
      areaId: c.areaId ? String(c.areaId) : "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.nombreCompleto.trim()) return toast.error("El nombre es obligatorio");
    if (!form.correo.trim()) return toast.error("El correo es obligatorio");
    if (!form.areaId) return toast.error("Debe seleccionar un área");

    // Validar teléfono con libphonenumber si se ingresó
    const tel = (form.telefono || "").replace(/\s+/g, "");
    if (tel && tel !== `+${getCountryCallingCode(phoneCountry as any)}`) {
      const parsed = parsePhoneNumberFromString(tel);
      if (!parsed || !parsed.isValid()) {
        return toast.error(`Teléfono inválido para ${phoneCountry}`);
      }
    }

    setSaving(true);
    try {
      if (editing && form.id) {
        await apiUpdateExternalCollaborator(form.id, {
          nombreCompleto: form.nombreCompleto.trim(),
          correo: form.correo.trim(),
          telefono: tel || null,
          rol: form.rol,
          areaId: Number(form.areaId),
        });
        toast.success("Colaborador actualizado");
      } else {
        await apiCreateExternalCollaborator({
          nombreCompleto: form.nombreCompleto.trim(),
          correo: form.correo.trim(),
          telefono: tel || null,
          rol: form.rol,
          areaId: Number(form.areaId),
        });
        toast.success("Colaborador externo creado — se le enviará un correo para configurar su contraseña");
      }
      setOpen(false);
      load(editing ? page : 1);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(c: ExternalColaborador) {
    setConfirmState({
      title: "Eliminar colaborador",
      message: `¿Eliminar a ${c.nombreCompleto}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await apiDeleteExternalCollaborator(c.id);
          toast.success("Colaborador eliminado");
          load(1);
          setPage(1);
        } catch {
          toast.error("No se pudo eliminar");
        }
      },
    });
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Colaboradores Externos</h2>
          <p className="text-sm text-slate-500">
            Usuarios externos asignados a un área: solicitantes de factura y voluntariado externo.
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
            <Plus className="h-4 w-4 mr-1" /> Nuevo externo
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="max-w-xs">
        <Input
          placeholder="Buscar por nombre o correo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Estado de carga / vacío */}
      {loading && <p className="text-sm text-slate-400 py-6 text-center">Cargando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-400 py-6 text-center">No hay colaboradores externos registrados.</p>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* MOBILE: tarjetas */}
          <div className="md:hidden space-y-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{c.nombreCompleto}</p>
                    <p className="text-sm text-slate-500 truncate">{c.correo}</p>
                    {c.telefono && <p className="text-xs text-slate-400 mt-0.5">{c.telefono}</p>}
                  </div>
                  <Badge className={c.estado === "ACTIVO"
                    ? "bg-green-100 text-green-700 border-green-200 shrink-0"
                    : "bg-gray-100 text-gray-500 border-gray-200 shrink-0"
                  }>
                    {c.estado}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    {ROL_LABELS[c.rol] ?? c.rol}
                  </Badge>
                  {c.areaOrg?.nombre && (
                    <span className="text-blue-600 font-medium">{c.areaOrg.nombre}</span>
                  )}
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-md transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 rounded-md transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: tabla */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                  <th className="px-4 py-2 text-left font-medium">Correo</th>
                  <th className="px-4 py-2 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-2 text-center font-medium">Rol</th>
                  <th className="px-4 py-2 text-center font-medium">Área</th>
                  <th className="px-4 py-2 text-center font-medium">Estado</th>
                  <th className="px-4 py-2 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-slate-800">{c.nombreCompleto}</td>
                    <td className="px-4 py-2 text-slate-600">{c.correo}</td>
                    <td className="px-4 py-2 text-slate-500">{c.telefono ?? "—"}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                        {ROL_LABELS[c.rol] ?? c.rol}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-blue-600 font-medium">
                      {c.areaOrg?.nombre ?? <span className="italic text-slate-300">Sin área</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge className={c.estado === "ACTIVO"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                      }>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(c)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(c)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
            Página {page} de {totalPages} ({total} registros)
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
        <div className="p-6 space-y-4 min-w-[340px]">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? "Editar colaborador externo" : "Nuevo colaborador externo"}
          </h2>

          <div className="space-y-1">
            <Label htmlFor="ext-nombre">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ext-nombre"
              value={form.nombreCompleto}
              onChange={(e) => {
                const val = e.target.value
                  .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, "")
                  .replace(/\s{2,}/g, " ");
                setForm((f) => ({ ...f, nombreCompleto: val.slice(0, 80) }));
              }}
              placeholder="Nombre y apellidos"
              maxLength={80}
              autoFocus
            />
            <p className="text-xs text-slate-400 text-right">
              {form.nombreCompleto.length}/80
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ext-correo">
              Correo electrónico <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ext-correo"
              type="email"
              value={form.correo}
              onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
              placeholder="usuario@ejemplo.com"
              disabled={editing}
            />
            {editing && (
              <p className="text-xs text-slate-400">El correo no se puede cambiar una vez creado.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ext-tel">Teléfono</Label>
            <PhoneInput
              id="ext-tel"
              international
              withCountryCallingCode
              countryCallingCodeEditable={false}
              defaultCountry="CR"
              value={form.telefono || undefined}
              onCountryChange={handlePhoneCountryChange}
              onChange={handlePhoneChange}
              className="PhoneInput"
              numberInputProps={{
                inputMode: "tel",
                autoComplete: "tel",
                onKeyDown: handlePhoneKeyDown,
              }}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ext-rol">
              Rol <span className="text-red-500">*</span>
            </Label>
            <select
              id="ext-rol"
              value={form.rol}
              onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as ExternalRol }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="colaboradorsolicitante">Solicitante (crea solicitudes de factura)</option>
              <option value="colaboradorvoluntariadoexterno">Voluntariado Externo (gestiona voluntarios)</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ext-area">
              Área asignada <span className="text-red-500">*</span>
            </Label>
            <select
              id="ext-area"
              value={form.areaId}
              onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Seleccionar área —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
            {areas.length === 0 && (
              <p className="text-xs text-amber-500">
                No hay áreas activas. Primero crea un área en la sección Proyectos → Áreas.
              </p>
            )}
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
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear colaborador"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}
