// src/services/dashboard.service.ts
import API from "./api";

/** Tipos que ya usa tu UI */
export interface DashboardMetrics {
  metrics: {
    users: { total: number; label: string };
    projects: {
      total: number;
      active: number;
      draft: number;
      finished: number;
      label: string;
    };
    files: {
      total: number;
      documents: number;
      images: number;
      lastUpload: { name: string; date: string } | null;
      label: string;
    };
    volunteering: {
      total: number;
      thisMonth: number;
      pendingRequests: number;
      label: string;
    };
    accounting: {
      total: number;
      ingresos: number;
      egresos: number;
      balance: number;
      label: string;
    };
    billing: {
      total: number;
      pending: number;
      paid: number;
      rejected: number;
      label: string;
    };
  };
  alerts: {
    draftProjects: number;
    inactiveCollaborators: number;
    pendingBillingRequests: number;
    pendingVolunteerRequests: number;
  };
  recap: { monthlyActivities: number; lastActivity: string | null };
  quickAccess: Array<{ name: string; href: string; icon: string }>;
  timestamp: string;
}

/**
 * Mantiene proyectos/archivos/etc desde /dashboard/metrics (como ya te funciona)
 * y SOLO refuerza el total de voluntarios leyendo /voluntarios.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // 1) Trae el dashboard agregado que ya te funciona (proyectos/archivos/usuarios…)
  const dash = await API.get<DashboardMetrics>("/dashboard/metrics").then(r => r.data);

  // 2) Refuerza "voluntarios" SIN tocar lo demás
  try {
    const vols = await API.get<any>("/voluntarios", { params: { page: 1, limit: 1 } }).then(r => r.data);

    // Soporta varias formas de respuesta: { total }, { data: [] }, o []
    const total =
      typeof vols?.total === "number"
        ? vols.total
        : Array.isArray(vols?.data)
        ? vols.data.length
        : Array.isArray(vols)
        ? vols.length
        : 0;

    // Asegura estructura y copia solo lo necesario
    if (!dash.metrics.volunteering) {
      dash.metrics.volunteering = { total: 0, thisMonth: 0, pendingRequests: 0, label: "Voluntarios" };
    }
    dash.metrics.volunteering.total = Number.isFinite(total) ? total : 0;
    if (dash.metrics.volunteering.thisMonth == null) dash.metrics.volunteering.thisMonth = 0;
    if (!dash.metrics.volunteering.label) dash.metrics.volunteering.label = "Voluntarios";
  } catch {
    // Si /voluntarios falla, no rompemos Proyectos/Archivos
  }

  return dash;
}
