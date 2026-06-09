"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Receipt,
  Handshake,
  Wallet,
  BarChart3,
  FolderKanban,
  MessageSquare,
  FileText,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Role =
  | "admin"
  | "voluntario"
  | "colaboradorfactura"
  | "colaboradorvoluntariado"
  | "colaboradorproyecto"
  | "colaboradorcontabilidad"
  | "colaboradorvisitacion";

type ModuleCard = {
  key: string;
  title: string;
  desc: string;
  href: string;
  icon: any;
  cardClasses: string;
  badgeClasses: string;
  linkClasses: string;
  roles: Role[];
  fullWidth?: boolean;
  badgeCount?: number;
};

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

function normalizeRole(v?: string | null): Role | null {
  if (!v) return null;
  const low = v.toLowerCase();
  const allowed: Role[] = [
    "admin",
    "voluntario",
    "colaboradorfactura",
    "colaboradorvoluntariado",
    "colaboradorproyecto",
    "colaboradorcontabilidad",
    "colaboradorvisitacion",
  ];
  return (allowed as string[]).includes(low) ? (low as Role) : null;
}

export default function AdminDashboardPage() {
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);
  const [pendingRespuestasFormulariosCount, setPendingRespuestasFormulariosCount] =
    useState(0);

  async function loadPendingCommentsCount() {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/comments/admin/pending-count`;

      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el conteo de comentarios");
      }

      const data = await res.json();
      setPendingCommentsCount(Number(data?.count ?? 0));
    } catch {
      setPendingCommentsCount(0);
    }
  }

  async function loadPendingRespuestasFormulariosCount() {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/respuestas-formulario/pending-count`;

      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el conteo de respuestas de formularios");
      }

      const data = await res.json();
      setPendingRespuestasFormulariosCount(Number(data?.total ?? 0));
    } catch {
      setPendingRespuestasFormulariosCount(0);
    }
  }

  useEffect(() => {
    const t = getToken();
    const p = getJwtPayload<{ role?: string; rol?: string; roles?: string[] }>(t);
    const raw: string[] = [
      ...(Array.isArray(p?.roles) ? p.roles : []),
      ...(p?.role ? [p.role] : []),
      ...(p?.rol ? [p.rol] : []),
    ];
    const normalized = raw
      .map((r) => normalizeRole(r))
      .filter((r): r is Role => r !== null);
    setUserRoles([...new Set(normalized)]);

    loadPendingCommentsCount();
    loadPendingRespuestasFormulariosCount();

    const onFocus = () => {
      loadPendingCommentsCount();
      loadPendingRespuestasFormulariosCount();
    };

    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      loadPendingCommentsCount();
      loadPendingRespuestasFormulariosCount();
    }, 5000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  const MODULES: ModuleCard[] = useMemo(
    () => [
      {
        key: "vol",
        title: "Voluntariado",
        desc: "Gestión de formularios, estados y participantes",
        href: "/admin/voluntariado",
        icon: Handshake,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-teal-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-teal-50 group-hover:border-teal-200",
        linkClasses:
          "mt-4 text-sm font-medium text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin", "colaboradorvoluntariado", "voluntario"],
      },
      {
        key: "proy",
        title: "Áreas,Proyectos y Programas",
        desc: "Gestión de Áreas, Proyectos y Programas activos y finalizados",
        href: "/admin/projects",
        icon: FolderKanban,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200",
        linkClasses:
          "mt-4 text-sm font-medium text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin", "colaboradorproyecto"],
      },
      {
        key: "billing",
        title: "Solicitudes y Facturación",
        desc: "Consulta y administración de solicitudes",
        href: "/admin/BillingRequest",
        icon: Receipt,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-green-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-green-50 group-hover:border-green-200",
        linkClasses:
          "mt-4 text-sm font-medium text-green-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin", "colaboradorfactura", "colaboradorcontabilidad"],
      },
      {
        key: "colabs",
        title: "Colaboradores",
        desc: "Miembros, roles, permisos y estados",
        href: "/admin/Collaborators",
        icon: Users,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-purple-50 group-hover:border-purple-200",
        linkClasses:
          "mt-4 text-sm font-medium text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin"],
      },
      {
        key: "acct",
        title: "Contabilidad",
        desc: "Ingresos, egresos y reportes financieros",
        href: "/admin/accounting",
        icon: Wallet,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-orange-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-orange-50 group-hover:border-orange-200",
        linkClasses:
          "mt-4 text-sm font-medium text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin", "colaboradorcontabilidad"],
      },
      {
        key: "recap",
        title: "Recapitulación",
        desc: "KPIs, métricas y resúmenes",
        href: "/admin/recapitulacion",
        icon: BarChart3,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-red-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-red-50 group-hover:border-red-200",
        linkClasses:
          "mt-4 text-sm font-medium text-red-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin"],
      },
      {
        key: "comments",
        title: "Comentarios",
        desc: "Validar, aprobar o denegar comentarios del landing",
        href: "/admin/comments",
        icon: MessageSquare,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-200",
        linkClasses:
          "mt-4 text-sm font-medium text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin"],
        badgeCount: pendingCommentsCount,
      },
      {
        key: "respuestas",
        title: "Respuestas de Formularios",
        desc: "Visualiza y gestiona las respuestas de los formularios públicos",
        href: "/admin/respuestas-formulario",
        icon: FileText,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-cyan-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-cyan-50 group-hover:border-cyan-200",
        linkClasses:
          "mt-4 text-sm font-medium text-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin"],
        badgeCount: pendingRespuestasFormulariosCount,
      },
      {
        key: "visitacion",
        title: "Visitación",
        desc: "Registro de visitas: nacionales, extranjeros y totales",
        href: "/admin/visitacion",
        icon: Eye,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-sky-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-sky-50 group-hover:border-sky-200",
        linkClasses:
          "mt-4 text-sm font-medium text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin", "colaboradorvisitacion"],
      },
      {
        key: "auditoria",
        title: "Auditoría",
        desc: "Quién hizo qué: registro de acciones de todos los usuarios del sistema",
        href: "/admin/auditoria",
        icon: ShieldCheck,
        cardClasses:
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-amber-300",
        badgeClasses:
          "rounded-2xl p-3 bg-slate-50 border border-slate-200 group-hover:bg-amber-50 group-hover:border-amber-200",
        linkClasses:
          "mt-4 text-sm font-medium text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity",
        roles: ["admin"], // ⚠️ solo admin
      },
    ],
    [pendingCommentsCount, pendingRespuestasFormulariosCount]
  );
  

  const visibleModules = useMemo(() => {
    if (!userRoles.length) return MODULES; // aún cargando
    if (userRoles.includes("admin")) return MODULES;
    return MODULES.filter((m) => m.roles.some((r) => userRoles.includes(r)));
  }, [MODULES, userRoles]);

  // Le notificamos al AdminSidebar (renderizado por el layout) cuántos
  // comentarios están pendientes para que muestre el badge.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("admin-pending-comments", {
          detail: { count: pendingCommentsCount },
        }),
      );
    }
  }, [pendingCommentsCount]);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Módulos del Sistema</h1>
            <p className="text-slate-500">Gestiona cada área de la organización</p>
          </div>

          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Volver al sitio
            </Button>
          </Link>
        </div>

        <section className="mb-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleModules.map((m) => {
              const Icon = m.icon;
              const colSpan = m.fullWidth ? "lg:col-span-3" : "";

              return (
                <Link key={m.key} href={m.href} className={`group ${colSpan}`}>
                  <div
                    className={`${m.cardClasses} flex h-full min-h-[170px] flex-col justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className={m.badgeClasses}>
                          <Icon className="h-7 w-7" />
                        </div>

                        {typeof m.badgeCount === "number" && m.badgeCount > 0 && (
                          <span className="absolute -top-2 -right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                            {m.badgeCount > 99 ? "99+" : m.badgeCount}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{m.title}</h3>
                        <p className="text-sm text-slate-500">{m.desc}</p>
                      </div>
                    </div>

                    <div className={m.linkClasses}>Ir →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}