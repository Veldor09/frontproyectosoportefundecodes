"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Ban, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { Sancion } from "../types/sancion";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  sancion: Sancion;
  onEdit: () => void;
  onDelete: () => void;
  onRevocar: () => void;
}

export default function SancionRow({ sancion, onEdit, onDelete, onRevocar }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRevocarConfirm, setShowRevocarConfirm] = useState(false);

  const getEstadoInfo = () => {
    if (sancion.estado === "REVOCADA") {
      return {
        badge: <Badge variant="secondary" className="bg-gray-100 text-gray-700">Revocada</Badge>,
        icon: <Ban className="h-4 w-4 text-gray-500" />,
      };
    }
    if (sancion.estado === "EXPIRADA") {
      return {
        badge: <Badge variant="secondary" className="bg-green-100 text-green-700">Expirada</Badge>,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      };
    }
    return {
      badge: <Badge variant="destructive" className="bg-red-100 text-red-700">Activa</Badge>,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    };
  };

  const { badge, icon } = getEstadoInfo();

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const calcularDiasRestantes = () => {
    if (!sancion.fechaVencimiento || sancion.estado !== "ACTIVA") return null;
    const hoy = new Date();
    const vencimiento = new Date(sancion.fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const diasRestantes = calcularDiasRestantes();

  return (
    <>
      <tr className="hover:bg-slate-50 border-b border-slate-200">
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-slate-800">{sancion.voluntario?.nombre || "N/A"}</p>
            <p className="text-xs text-slate-500">
              {sancion.voluntario?.email ?? sancion.voluntario?.nacionalidad ?? "—"}
            </p>
          </div>
        </td>

        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-slate-800">{sancion.tipo}</p>
            <p className="text-sm text-slate-600 truncate max-w-48" title={sancion.motivo}>
              {sancion.motivo}
            </p>
          </div>
        </td>

        <td className="px-4 py-3 text-sm">
          <div>
            <p><strong>Inicio:</strong> {formatFecha(sancion.fechaInicio)}</p>
            <p><strong>Vence:</strong> {sancion.fechaVencimiento ? formatFecha(sancion.fechaVencimiento) : "Permanente"}</p>
            {diasRestantes !== null && diasRestantes > 0 && (
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" /> {diasRestantes} días restantes
              </p>
            )}
          </div>
        </td>

        <td className="px-4 py-3"><div className="flex items-center gap-2">{icon}{badge}</div></td>
        <td className="px-4 py-3 text-sm text-slate-600">{sancion.creadaPor || "N/A"}</td>

        <td className="px-4 py-3">
          <div className="flex gap-1">
            <Button size="sm" onClick={onEdit} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              Editar
            </Button>

            {sancion.estado === "ACTIVA" && (
              <Button size="sm" onClick={() => setShowRevocarConfirm(true)} className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white">
                Revocar
              </Button>
            )}

            <Button size="sm" onClick={() => setShowDeleteConfirm(true)} className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </Button>
          </div>
        </td>
      </tr>

      {/* ConfirmDialogs — solo open/onOpenChange/onConfirm/title/description */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Eliminar Sanción"
        description={`¿Está seguro de que desea eliminar permanentemente esta sanción de ${sancion.voluntario?.nombre}?`}
      />

      <ConfirmDialog
        open={showRevocarConfirm}
        onOpenChange={setShowRevocarConfirm}
        onConfirm={() => {
          onRevocar();
          setShowRevocarConfirm(false);
        }}
        title="Revocar Sanción"
        description={`¿Está seguro de que desea revocar esta sanción activa de ${sancion.voluntario?.nombre}?`}
      />
    </>
  );
}
