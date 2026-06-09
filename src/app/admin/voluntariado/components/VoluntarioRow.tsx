"use client";

import { Voluntario } from "../types/voluntario";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  voluntario: Voluntario;
  onEdit: () => void;
  onDelete: () => void;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

export default function VoluntarioRow({ voluntario, onEdit, onDelete }: Props) {
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-800">{voluntario.nombre}</td>
      <td className="px-4 py-3 text-slate-600">{voluntario.nacionalidad ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{voluntario.email ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{fmtDate(voluntario.fechaEntrada)}</td>
      <td className="px-4 py-3 text-slate-600">{fmtDate(voluntario.fechaSalida)}</td>
      <td className="px-4 py-3 text-slate-600">{voluntario.ong ?? "—"}</td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Editar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  el registro de <strong>{voluntario.nombre}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}
