"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role =
  | "admin"
  | "colaboradorfactura"
  | "voluntario"
  | "colaboradorvoluntariado"
  | "colaboradorproyecto"
  | "colaboradorcontabilidad";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getJwtPayload<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function hasPermissions(required: string[] | undefined, token: string | null): boolean {
  if (!required || required.length === 0) return true;
  const payload = getJwtPayload<{ perms?: string[] }>(token);
  const userPerms = new Set(payload?.perms ?? []);
  return required.every((p) => userPerms.has(p));
}

function getUserRole(token: string | null): Role | null {
  const p = getJwtPayload<{ role?: string; rol?: string; roles?: string[] }>(token);
  const candidate = p?.role ?? p?.rol ?? (Array.isArray(p?.roles) ? p!.roles[0] : undefined);
  if (!candidate) return null;
  const low = candidate.toLowerCase();
  const allowed: Role[] = [
    "admin",
    "colaboradorfactura",
    "voluntario",
    "colaboradorvoluntariado",
    "colaboradorproyecto",
    "colaboradorcontabilidad",
  ];
  return (allowed as string[]).includes(low) ? (low as Role) : null;
}

function hasRequiredRole(requiredRoles: Role[] | undefined, token: string | null): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  const role = getUserRole(token);
  if (!role) return false;
  return requiredRoles.includes(role) || role === "admin"; // admin pasa siempre
}

type Props = {
  /** permisos (legacy) */
  require?: string[];
  /** nuevos: roles aceptados para la ruta */
  requireRoles?: Role[];
  fallbackHref?: string;
  children: ReactNode;
};

export default function RequirePermission({
  require,
  requireRoles,
  fallbackHref = "/admin",
  children,
}: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!hasRequiredRole(requireRoles, token) || !hasPermissions(require, token)) {
      router.replace(fallbackHref);
      return;
    }
    setOk(true);
    setChecking(false);
  }, [router, require, requireRoles, fallbackHref]);

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
        Verificando permisos…
      </div>
    );
  }

  if (!ok) return null;
  return <>{children}</>;
}
