/**
 * useSolicitanteRole
 *
 * Centraliza la detección del rol colaboradorsolicitante y los datos del
 * usuario actual (sub / email) a partir del JWT almacenado en localStorage.
 *
 * Reglas de negocio:
 *  - colaboradorsolicitante sólo puede crear solicitudes, ver sus propias
 *    solicitudes y consultar el historial (lectura). No puede validar,
 *    aprobar ni registrar pagos.
 */
"use client";

import { useMemo } from "react";
import { getToken, getJwtPayload } from "@/lib/auth";

type JwtPayload = {
  sub?: number;
  email?: string;
  roles?: string[];
};

/** Roles considerados "sólo solicitante" (acceso limitado al módulo). */
const SOLICITANTE_ROLES = ["colaboradorsolicitante"] as const;

export function useSolicitanteRole() {
  return useMemo(() => {
    const token = getToken();
    const payload = getJwtPayload<JwtPayload>(token);

    const roles: string[] = payload?.roles ?? [];
    const isSolicitante = roles.some((r) => SOLICITANTE_ROLES.includes(r as any));

    return {
      /** true  → usuario es colaboradorsolicitante (acceso limitado) */
      isSolicitante,
      /** User.id del JWT (sub) */
      userId: payload?.sub ?? null,
      /** Email del usuario autenticado */
      userEmail: payload?.email ?? null,
    };
  }, []);
}
