"use client";

import React from "react";
import { Toaster as SonnerToaster } from "sonner";
// Si usas react-hot-toast en algunas pantallas (p. ej. /login), deja también su Toaster:
import { Toaster as HotToaster } from "react-hot-toast";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Notificaciones globales */}
      <SonnerToaster position="top-right" richColors closeButton />
      <HotToaster position="top-right" />
    </>
  );
}
