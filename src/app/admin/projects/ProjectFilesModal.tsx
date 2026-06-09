"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ProjectFilesManager } from "./ProjectFilesManager";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: number | null;
};

export default function ProjectFilesModal({ open, onOpenChange, projectId }: Props) {
  const [closing, setClosing] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!closing) onOpenChange(v); }}>
      <AlertDialogContent className="sm:max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar archivos al proyecto</AlertDialogTitle>
          <AlertDialogDescription>
            Sube archivos ahora o hazlo más tarde desde la edición del proyecto.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-2">
          {projectId ? (
            <ProjectFilesManager projectId={projectId} onFilesChange={() => {}} />
          ) : (
            <p className="text-sm text-muted-foreground">Guardando proyecto…</p>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Omitir
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setClosing(true);
              onOpenChange(false);
              setClosing(false);
            }}
          >
            Finalizar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}