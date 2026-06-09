"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";
import { useSancionesActivasVoluntario } from "../hooks/useSanciones";
import Modal from "@/components/ui/Modal";

interface Props {
  voluntarioId: number;
  voluntarioNombre: string;
}

export default function VoluntarioSancionIndicator({
  voluntarioId,
  voluntarioNombre,
}: Props) {
  const { data: sancionesActivas, loading } =
    useSancionesActivasVoluntario(voluntarioId);
  const [showModal, setShowModal] = useState(false);

  if (loading) return null;
  if (sancionesActivas.length === 0) return null;

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const calcularDiasRestantes = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;

    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <>
      {/* Indicador (badge) */}
      <div className="flex items-center gap-1">
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer text-xs"
          onClick={() => setShowModal(true)}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          {sancionesActivas.length} Sanción
          {sancionesActivas.length > 1 ? "es" : ""}
        </Badge>
      </div>

      {/* Modal sin prop size (ya no genera error) */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`Sanciones Activas - ${voluntarioNombre}`}
      >
        <div className="space-y-4">
          {sancionesActivas.map((sancion) => {
            const diasRestantes = calcularDiasRestantes(
              sancion.fechaVencimiento ?? null // ✅ evita error TS
            );

            return (
              <div
                key={sancion.id}
                className="border border-red-200 bg-red-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-red-900">
                      {sancion.tipo}
                    </h4>
                    <p className="text-red-700 text-sm mt-1">
                      {sancion.motivo}
                    </p>
                  </div>
                  <Badge variant="destructive" className="bg-red-600">
                    Activa
                  </Badge>
                </div>

                {sancion.descripcion && (
                  <div className="mb-3">
                    <p className="text-sm text-red-800 bg-red-100 p-2 rounded">
                      {sancion.descripcion}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-red-700">
                  <div>
                    <strong>Fecha de inicio:</strong>
                    <br />
                    {formatFecha(sancion.fechaInicio)}
                  </div>
                  <div>
                    <strong>Fecha de vencimiento:</strong>
                    <br />
                    {sancion.fechaVencimiento
                      ? formatFecha(sancion.fechaVencimiento)
                      : "Permanente"}
                  </div>
                </div>

                {diasRestantes !== null && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                    <Clock className="h-4 w-4" />
                    {diasRestantes > 0
                      ? `Vence en ${diasRestantes} día${
                          diasRestantes > 1 ? "s" : ""
                        }`
                      : "Vencida (pendiente de actualizar)"}
                  </div>
                )}

                {sancion.creadaPor && (
                  <div className="mt-2 text-xs text-red-600">
                    Aplicada por: {sancion.creadaPor}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
