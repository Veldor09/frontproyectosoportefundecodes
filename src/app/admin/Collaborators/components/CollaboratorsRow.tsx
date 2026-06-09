"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "./ConfirmDialog";
import { Collaborator } from "@/app/admin/Collaborators/types/collaborators.types";

const ROLE_LABEL: Record<string, string> = {
  admin:                      "Admin",
  colaboradorfactura:         "Factura",
  colaboradorvoluntariado:    "Voluntariado",
  colaboradorproyecto:        "Proyecto",
  colaboradorcontabilidad:    "Contabilidad",
  colaboradorvisitacion:      "Visitación",
  colaboradorsolicitante:     "Solicitante",
  colaboradorvoluntariadoexterno: "Vol. Externo",
};

interface Props {
  collaborator: Collaborator;
  onEdit: () => void;
  /** Puede ser sync o async */
  onToggle: () => void | Promise<void>;
  /** Puede ser sync o async */
  onDelete: () => void | Promise<void>;
}

export default function CollaboratorsRow({
  collaborator,
  onEdit,
  onToggle,
  onDelete,
}: Props) {
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"none" | "toggle" | "delete">("none");

  const isActive = collaborator.status === "ACTIVO";

  const exec = async (
    kind: "toggle" | "delete",
    fn: () => void | Promise<void>
  ) => {
    if (busy !== "none") return;
    setBusy(kind);
    try {
      await Promise.resolve(fn());
    } finally {
      setBusy("none");
    }
  };

  return (
    <>
      <tr
        className={`border-b transition ${
          busy !== "none" ? "opacity-60 pointer-events-none" : ""
        }`}
        data-busy={busy !== "none"}
      >
        <td className="px-4 py-4 text-slate-800 font-medium whitespace-nowrap">
          {collaborator.fullName}
        </td>
        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
          {collaborator.email}
        </td>
        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
          {collaborator.phone ?? "—"}
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {(collaborator.roles?.length ? collaborator.roles : [collaborator.role]).map((r) => (
              <span
                key={r}
                className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium whitespace-nowrap"
              >
                {ROLE_LABEL[r] ?? r}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
          {collaborator.identification}
        </td>
        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
          {collaborator.birthdate
            ? (() => {
                const [y, m, d] = collaborator.birthdate.split("T")[0].split("-");
                return `${d}/${m}/${y}`;
              })()
            : "—"}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isActive ? "Activo" : "Inactivo"}
          </span>
        </td>

        <td className="px-2 py-4 whitespace-nowrap">
          <div className="flex gap-1">
            {/* Editar */}
            <Button
              variant="default"
              onClick={onEdit}
              title="Editar colaborador"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
            >
              Editar
            </Button>

            {/* Activar/Inactivar */}
            <Button
              onClick={() => setConfirmToggle(true)}
              title={isActive ? "Inactivar colaborador" : "Activar colaborador"}
              disabled={busy !== "none"}
              className={`text-xs px-3 py-1 h-auto text-white ${
                isActive
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isActive ? "Desactivar" : "Activar"}
            </Button>

            {/* Eliminar */}
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              title="Eliminar colaborador"
              disabled={busy !== "none"}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-auto"
            >
              Eliminar
            </Button>
          </div>
        </td>
      </tr>

      {/* Confirmar toggle */}
      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title="¿Cambiar estado?"
        description={`El colaborador pasará a estar ${
          isActive ? "inactivo" : "activo"
        }.`}
        confirmText={isActive ? "Inactivar" : "Activar"}
        onConfirm={() => {
          setConfirmToggle(false);
          exec("toggle", onToggle);
        }}
      />

      {/* Confirmar eliminar */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Estás seguro?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente el registro del colaborador "${collaborator.fullName}".`}
        confirmVariant="destructive"
        confirmText="Eliminar"
        onConfirm={() => {
          setConfirmDelete(false);
          exec("delete", onDelete);
        }}
      />
    </>
  );
}