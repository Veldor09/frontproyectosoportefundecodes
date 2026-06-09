"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, X, FolderOpen, ChevronDown, Check } from "lucide-react";
import { Voluntario } from "../types/voluntario";
import Modal from "@/components/ui/Modal";
import { Listbox, Transition } from "@headlessui/react";
import { useProgramaVoluntariado } from "../hooks/useProgramaVoluntariado";
import type {
  AsignacionProgramaPayload,
  OrigenVoluntariado,
} from "../services/programaVoluntariadoService";

interface Props {
  voluntario: Voluntario;
  open: boolean;
  onClose: () => void;
}

export default function AsignacionModal({ voluntario, open, onClose }: Props) {
  const { data: programas, loading, assign, refetch } = useProgramaVoluntariado();

  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  const [pagoRealizado, setPagoRealizado] = useState(false);
  const [origen, setOrigen] = useState<OrigenVoluntariado>("CUENTA_PROPIA");
  const [intermediario, setIntermediario] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [fechaSalida, setFechaSalida] = useState<string>("");
  const [horasTotales, setHorasTotales] = useState<number>(0);

  function getProgramaStats(programa: (typeof programas)[number]) {
    const asignados = programa.voluntariosAsignados?.length || 0;
    const limite = Number(programa.limiteParticipantes ?? 0);
    const sinLimite = limite === 0;
    const disponibles = sinLimite ? null : Math.max(limite - asignados, 0);
    const lleno = !sinLimite && asignados >= limite;

    return { asignados, limite, sinLimite, disponibles, lleno };
  }

  const programasDisponibles = useMemo(
    () =>
      (programas ?? []).filter((p) => {
        const yaAsignado = (p.voluntariosAsignados ?? [])
          .map(String)
          .includes(String(voluntario.id));

        if (yaAsignado) return false;

        const stats = getProgramaStats(p);
        return !stats.lleno;
      }),
    [programas, voluntario.id]
  );

  const programasAsignados = useMemo(
    () =>
      (programas ?? []).filter((p) =>
        (p.voluntariosAsignados ?? []).map(String).includes(String(voluntario.id))
      ),
    [programas, voluntario.id]
  );

  const handleGuardar = async () => {
    if (!programaSeleccionado) {
      toast.error("Debes seleccionar un programa");
      return;
    }

    if (origen === "INTERMEDIARIO" && !intermediario.trim()) {
      toast.error("Debes indicar el intermediario/empresa");
      return;
    }

    const payload: AsignacionProgramaPayload = {
      pagoRealizado,
      origen,
      intermediario: origen === "INTERMEDIARIO" ? intermediario.trim() : null,
      fechaEntrada: new Date(`${fechaEntrada}T00:00:00.000Z`).toISOString(),
      fechaSalida: fechaSalida
        ? new Date(`${fechaSalida}T00:00:00.000Z`).toISOString()
        : null,
      horasTotales: Number.isFinite(+horasTotales) ? Number(horasTotales) : 0,
    };

    setGuardando(true);
    try {
      await assign(voluntario.id, programaSeleccionado, payload);
      toast.success("Voluntario asignado correctamente");
      await refetch();
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? "Error al asignar voluntario";
      toast.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Asignar Voluntario a Programa">
      <div className="max-w-2xl w-full space-y-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900">{voluntario.nombre}</h3>
          <p className="text-sm text-blue-700">{voluntario.email}</p>
        </div>

        {programasAsignados.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Programas asignados actualmente:</h4>
            <div className="space-y-2">
              {programasAsignados.map((p) => {
                const stats = getProgramaStats(p);

                return (
                  <div key={p.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">{p.nombre}</div>
                    <div className="text-sm text-green-700">{p.descripcion}</div>
                    <div className="text-xs text-green-800 mt-1">
                      {stats.sinLimite
                        ? "Sin límite de participantes"
                        : `Cupos: ${stats.asignados}/${stats.limite} · disponibles: ${stats.disponibles}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label className="text-slate-700 flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4" />
            Asignar a Programa
          </Label>

          {loading ? (
            <div className="text-sm text-slate-500">Cargando programas...</div>
          ) : programasDisponibles.length === 0 ? (
            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p>No hay programas disponibles para asignar</p>
            </div>
          ) : (
            <Listbox value={programaSeleccionado} onChange={setProgramaSeleccionado}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md border border-input bg-background py-2 pl-3 pr-10 text-left text-sm focus:outline-none">
                  <span className="block truncate">
                    {programaSeleccionado
                      ? (() => {
                          const programa = programasDisponibles.find(
                            (p) => String(p.id) === String(programaSeleccionado)
                          );
                          if (!programa) return "Seleccionar programa";

                          const stats = getProgramaStats(programa);
                          return stats.sinLimite
                            ? `${programa.nombre} — sin límite`
                            : `${programa.nombre} — ${stats.asignados}/${stats.limite} (${stats.disponibles} disponibles)`;
                        })()
                      : "Seleccionar programa"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </span>
                </Listbox.Button>

                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {programasDisponibles.map((programa) => {
                      const stats = getProgramaStats(programa);

                      return (
                        <Listbox.Option
                          key={programa.id}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${
                              active ? "bg-accent text-accent-foreground" : "text-foreground"
                            }`
                          }
                          value={String(programa.id)}
                        >
                          {({ selected }) => (
                            <>
                              <div>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
                                  {programa.nombre}
                                </span>
                                <span className="text-xs text-gray-500 block truncate">
                                  {programa.lugar ?? "—"} ·{" "}
                                  {stats.sinLimite
                                    ? "sin límite"
                                    : `${stats.asignados}/${stats.limite} (${stats.disponibles} disponibles)`}
                                </span>
                              </div>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      );
                    })}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700">Pago realizado</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pagoRealizado}
                onChange={(e) => setPagoRealizado(e.target.checked)}
              />
              <span className="text-sm text-slate-600">Marcar si ya pagó</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Origen</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={origen}
              onChange={(e) => setOrigen(e.target.value as OrigenVoluntariado)}
            >
              <option value="CUENTA_PROPIA">Cuenta propia</option>
              <option value="INTERMEDIARIO">Intermediario / Empresa</option>
            </select>
          </div>

          {origen === "INTERMEDIARIO" && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-700">Intermediario / Empresa</Label>
              <Input
                value={intermediario}
                onChange={(e) => setIntermediario(e.target.value)}
                placeholder="Ej: Empresa XYZ"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-700">Fecha de entrada</Label>
            <Input
              type="date"
              value={fechaEntrada}
              onChange={(e) => setFechaEntrada(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Fecha de salida (opcional)</Label>
            <Input
              type="date"
              value={fechaSalida}
              onChange={(e) => setFechaSalida(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-700">Horas totales</Label>
            <Input
              type="number"
              min={0}
              value={String(horasTotales)}
              onChange={(e) => setHorasTotales(Number(e.target.value))}
              placeholder="Ej: 40"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={guardando || !programaSeleccionado}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Asignar a programa
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}