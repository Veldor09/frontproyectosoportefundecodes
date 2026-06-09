"use client";

import { useEffect, useMemo, useState } from "react";
import { getDashboardMetrics, type DashboardMetrics as DashboardData } from "@/services/dashboard.service";
import { MetricCard } from "./MetricCard";
import { Users, FolderKanban, FileText, Handshake, Wallet, Receipt, AlertTriangle, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ===== Helpers para token/rol ===== */
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
type Role =
  | "admin"
  | "colaboradorfactura"
  | "colaboradorvoluntariado"
  | "colaboradorproyecto"
  | "colaboradorcontabilidad";

function getRoleFromToken(): Role | null {
  const t = getToken();
  const p = getJwtPayload<any>(t);
  const raw: string | undefined =
    (Array.isArray(p?.roles) && p.roles[0]) ||
    p?.role ||
    p?.rol ||
    p?.Rol ||
    undefined;

  if (!raw) return null;
  const r = String(raw).toLowerCase();
  if (
    r === "admin" ||
    r === "colaboradorfactura" ||
    r === "colaboradorvoluntariado" ||
    r === "colaboradorproyecto" ||
    r === "colaboradorcontabilidad"
  ) {
    return r as Role;
  }
  return null;
}

export function DashboardMetrics() {
  // Estado base
  const [role, setRole] = useState<Role | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const canVol = role === "admin" || role === "colaboradorvoluntariado";
  const canProy = role === "admin" || role === "colaboradorproyecto";
  const canBill = role === "admin" || role === "colaboradorfactura" || role === "colaboradorcontabilidad";
  const canAcct = role === "admin" || role === "colaboradorcontabilidad";

  // Efecto: obtener rol una sola vez
  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  // Efecto: cargar métricas cuando cambia el rol
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!role) {
        // aún detectando rol
        setLoading(true);
        return;
      }

      setError(null);

      if (role === "admin") {
        setLoading(true);
        try {
          const metrics = await getDashboardMetrics();
          if (!cancelled) setData(metrics);
        } catch (err: any) {
          if (!cancelled) setError(err?.message || "Error desconocido al cargar métricas");
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        // No admin: no consultamos backend de métricas agregadas
        setData(null);
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [role]);

  // Hook SIEMPRE llamado: métrica computada segura para todos los roles
  const metrics = useMemo(() => {
    const zeroLabel = { total: 0, label: "–" as string };
    if (isAdmin && data) return data.metrics;

    return {
      users: zeroLabel,
      projects: { total: 0, active: 0, draft: 0, finished: 0 },
      files: { total: 0, documents: 0, images: 0, lastUpload: null as any },
      volunteering: { total: 0, thisMonth: 0, pendingRequests: 0 },
      accounting: { total: 0, ingresos: 0, egresos: 0, balance: 0, label: "–" },
      billing: { total: 0, pending: 0, paid: 0, rejected: 0, label: "–" },
    };
  }, [isAdmin, data]);

  const alerts = useMemo(() => {
    if (isAdmin && data?.alerts) return data.alerts;
    return { draftProjects: 0, inactiveCollaborators: 0, pendingBillingRequests: 0, pendingVolunteerRequests: 0 };
  }, [isAdmin, data]);

  // A partir de aquí ya podemos renderizar condicional sin romper el orden de hooks
  if (!role) {
    return (
      <div className="min-h-[120px] flex items-center justify-center text-slate-500">
        Detectando rol…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 w-4 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && isAdmin) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => location.reload()} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Indicadores de alerta — solo admin/editor */}
      {isAdmin && (alerts.draftProjects > 0 || alerts.inactiveCollaborators > 0 || alerts.pendingBillingRequests > 0 || alerts.pendingVolunteerRequests > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {alerts.draftProjects > 0 && (
            <Link href="/admin/projects">
              <div className="flex items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 hover:bg-yellow-100 transition-colors cursor-pointer">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">{alerts.draftProjects} proyecto{alerts.draftProjects !== 1 ? "s" : ""} en borrador</p>
                  <p className="text-xs text-yellow-600">Pendiente de publicar</p>
                </div>
              </div>
            </Link>
          )}
          {alerts.inactiveCollaborators > 0 && (
            <Link href="/admin/Collaborators">
              <div className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 hover:bg-red-100 transition-colors cursor-pointer">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{alerts.inactiveCollaborators} colaborador{alerts.inactiveCollaborators !== 1 ? "es" : ""} inactivo{alerts.inactiveCollaborators !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-red-600">Requieren revisión</p>
                </div>
              </div>
            </Link>
          )}
          {alerts.pendingBillingRequests > 0 && (
            <Link href="/admin/BillingRequest">
              <div className="flex items-center gap-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 hover:bg-orange-100 transition-colors cursor-pointer">
                <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">{alerts.pendingBillingRequests} pago{alerts.pendingBillingRequests !== 1 ? "s" : ""} pendiente{alerts.pendingBillingRequests !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-orange-600">Por aprobar o pagar</p>
                </div>
              </div>
            </Link>
          )}
          {alerts.pendingVolunteerRequests > 0 && (
            <Link href="/admin/respuestas-formulario">
              <div className="flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 hover:bg-blue-100 transition-colors cursor-pointer">
                <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">{alerts.pendingVolunteerRequests} solicitud{alerts.pendingVolunteerRequests !== 1 ? "es" : ""} de voluntariado</p>
                  <p className="text-xs text-blue-600">Pendiente de revisar</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Métricas Principales (según rol) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ADMIN ve todo */}
        {isAdmin && (
          <>
            <MetricCard
              title="Voluntarios Activos"
              value={metrics.volunteering.total}
              label={`${metrics.volunteering.pendingRequests ?? 0} solicitud${(metrics.volunteering.pendingRequests ?? 0) !== 1 ? "es" : ""} pendiente${(metrics.volunteering.pendingRequests ?? 0) !== 1 ? "s" : ""}`}
              icon={Handshake}
              color="text-orange-600"
              href="/admin/voluntariado"
            />

            <MetricCard
              title="Proyectos Activos"
              value={metrics.projects.active ?? 0}
              label={`${metrics.projects.active ?? 0} de ${metrics.projects.total ?? 0} total`}
              icon={FolderKanban}
              color="text-green-600"
              subtitle={`${metrics.projects.draft ?? 0} borradores, ${metrics.projects.finished ?? 0} finalizados`}
              href="/admin/projects"
            />

            <MetricCard
              title="Archivos"
              value={metrics.files.total}
              label={`${metrics.files.documents} docs, ${metrics.files.images} imgs`}
              icon={FileText}
              color="text-purple-600"
              subtitle={
                (metrics as any).files?.lastUpload
                  ? `Último: ${(metrics as any).files?.lastUpload?.name}`
                  : "Sin archivos aún"
              }
              href="/admin/projects"
            />

            <MetricCard
              title="Colaboradores"
              value={metrics.users.total}
              label={metrics.users.label}
              icon={Users}
              color="text-blue-600"
              href="/admin/Collaborators"
            />

            <MetricCard
              title="Facturación"
              value={metrics.billing.pending ?? 0}
              label={`${metrics.billing.paid ?? 0} pagadas · ${metrics.billing.rejected ?? 0} rechazadas`}
              icon={Receipt}
              color="text-indigo-600"
              subtitle="Solicitudes pendientes"
              href="/admin/BillingRequest"
            />

            <MetricCard
              title="Balance del mes"
              value={metrics.accounting.balance ?? 0}
              label={`↑ ${fmtCurrency(metrics.accounting.ingresos ?? 0)}  ↓ ${fmtCurrency(metrics.accounting.egresos ?? 0)}`}
              icon={Wallet}
              color={(metrics.accounting.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}
              href="/admin/accounting"
            />
          </>
        )}

        {/* colaboradorvoluntariado (no admin) */}
        {canVol && !isAdmin && (
          <MetricCard
            title="Voluntarios"
            value={metrics.volunteering.total}
            label={"Acceso a Voluntariado"}
            icon={Handshake}
            color="text-orange-600"
            href="/admin/voluntariado"
          />
        )}

        {/* colaboradorproyecto (no admin) */}
        {canProy && !isAdmin && (
          <MetricCard
            title="Proyectos"
            value={metrics.projects.total ?? 0}
            label={"Gestión de proyectos"}
            icon={FolderKanban}
            color="text-green-600"
            href="/admin/projects"
          />
        )}

        {/* colaboradorfactura (no admin) */}
        {role === "colaboradorfactura" && (
          <MetricCard
            title="Facturación"
            value={metrics.billing.pending ?? 0}
            label={"Solicitudes pendientes"}
            icon={Receipt}
            color="text-indigo-600"
            href="/admin/BillingRequest"
          />
        )}

        {/* colaboradorcontabilidad (no admin) */}
        {role === "colaboradorcontabilidad" && (
          <>
            <MetricCard
              title="Balance del mes"
              value={metrics.accounting.balance ?? 0}
              label={`↑ ${fmtCurrency(metrics.accounting.ingresos ?? 0)}  ↓ ${fmtCurrency(metrics.accounting.egresos ?? 0)}`}
              icon={Wallet}
              color={(metrics.accounting.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}
              href="/admin/accounting"
            />
            <MetricCard
              title="Facturación"
              value={metrics.billing.pending ?? 0}
              label={"Solicitudes pendientes"}
              icon={Receipt}
              color="text-indigo-600"
              href="/admin/BillingRequest"
            />
          </>
        )}
      </div>

      {/* Resumen de contabilidad del mes — admin y colaboradorcontabilidad */}
      {(isAdmin || role === "colaboradorcontabilidad") && data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-500" />
              Contabilidad — mes actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <TrendingUp className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-green-700 font-medium">Ingresos</p>
                  <p className="text-lg font-bold text-green-800">{fmtCurrency(metrics.accounting.ingresos ?? 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <TrendingDown className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <p className="text-xs text-red-700 font-medium">Egresos</p>
                  <p className="text-lg font-bold text-red-800">{fmtCurrency(metrics.accounting.egresos ?? 0)}</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${(metrics.accounting.balance ?? 0) >= 0 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}>
                <Scale className={`h-6 w-6 shrink-0 ${(metrics.accounting.balance ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`} />
                <div>
                  <p className={`text-xs font-medium ${(metrics.accounting.balance ?? 0) >= 0 ? "text-blue-700" : "text-red-700"}`}>Balance</p>
                  <p className={`text-lg font-bold ${(metrics.accounting.balance ?? 0) >= 0 ? "text-blue-800" : "text-red-800"}`}>{fmtCurrency(metrics.accounting.balance ?? 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de facturación — admin, colaboradorfactura y colaboradorcontabilidad */}
      {(isAdmin || role === "colaboradorfactura" || role === "colaboradorcontabilidad") && data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-500" />
              Facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                <p className="text-2xl font-bold text-orange-700">{metrics.billing.pending ?? 0}</p>
                <p className="text-sm text-orange-600">Pendientes</p>
              </div>
              <div className="text-center rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-2xl font-bold text-green-700">{metrics.billing.paid ?? 0}</p>
                <p className="text-sm text-green-600">Pagadas</p>
              </div>
              <div className="text-center rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-2xl font-bold text-red-700">{metrics.billing.rejected ?? 0}</p>
                <p className="text-sm text-red-600">Rechazadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recapitulación: solo ADMIN con datos */}
      {isAdmin && data && (
        <Card>
          <CardHeader>
            <CardTitle>Recapitulación de Actividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.recap.monthlyActivities}
                </div>
                <p className="text-sm text-muted-foreground">Actividades este mes</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.metrics.projects.finished}
                </div>
                <p className="text-sm text-muted-foreground">Proyectos finalizados</p>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {data.recap.lastActivity
                    ? new Date(data.recap.lastActivity).toLocaleDateString()
                    : "Sin actividad"}
                </div>
                <p className="text-sm text-muted-foreground">Última actividad</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <div className="text-center text-xs text-muted-foreground">
          Última actualización: {new Date((data as any)?.timestamp ?? Date.now()).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export default DashboardMetrics;
