"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

type ConfirmVariant = "default" | "destructive" | "secondary" | "outline" | "ghost";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  /** Texto del botón confirmar (opcional) */
  confirmText?: string;
  /** Texto del botón cancelar (opcional) */
  cancelText?: string;
  /** Variante visual del botón confirmar (opcional) */
  confirmVariant?: ConfirmVariant;
  /** Clase extra opcional para el botón confirmar */
  confirmClassName?: string;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "default",
  confirmClassName,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>

          {/* Usamos Button para poder elegir variante visual */}
          <Button
            variant={confirmVariant as any}
            className={cn(confirmVariant === "destructive" && "text-white", confirmClassName)}
            onClick={onConfirm}
            asChild={false}
          >
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
