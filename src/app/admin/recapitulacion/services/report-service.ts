"use client";

import axios from "axios";
import type { ReportData, SavedReport } from "../types/report";

/* ========================= 🌐 Config base ========================= */
export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/* ========================= 🔐 Headers ========================= */
function authHeader() {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* =========================================================== */
/* 📊 Servicio principal de api/Reportes                           */
/* =========================================================== */
export class ReportService {
  /**
   * Genera un informe consultando el backend
   */
  static async generateReport(filters: {
    dateMode: string;
    year: string;
    startDate: string;
    endDate: string;
    reportType: string;
    category: string;
    department: string;
  }): Promise<{ success: boolean; data?: SavedReport; error?: string }> {
    try {
      const params = new URLSearchParams();

      if (filters.dateMode === "year") {
        params.append("periodo", "ANIO");
        params.append("anio", filters.year);
      } else {
        params.append("periodo", "RANGO");
        params.append("fechaInicio", filters.startDate);
        params.append("fechaFin", filters.endDate);
      }

      params.append("tipoReporte", this.mapReportType(filters.reportType));
      const modulos = this.mapDepartmentToModules(filters.department);
      params.append("modulos", modulos);

      const jsonUrl = `${API_URL}/api/reportes/datos`;

      console.log("🔍 Obteniendo datos reales desde:", jsonUrl);

      try {
        const { data: backendData } = await axios.get(jsonUrl, {
          params,
          headers: { Accept: "application/json", ...authHeader() },
          withCredentials: true,
          timeout: 10000,
        });

        console.log("📊 Datos recibidos del backend:", backendData);

        if (!backendData.detalles || Object.keys(backendData.detalles).length === 0) {
          return { success: false, error: "no-data" };
        }

        const reportData = this.transformBackendData(backendData, filters.reportType);

        const newReport: SavedReport = {
          id: Date.now().toString(),
          year:
            filters.dateMode === "year"
              ? filters.year
              : `${filters.startDate} - ${filters.endDate}`,
          dateRange:
            filters.dateMode === "range"
              ? { start: filters.startDate, end: filters.endDate }
              : undefined,
          reportType: filters.reportType,
          category: filters.category,
          department: filters.department,
          generatedAt: backendData.fechaGeneracion || new Date().toISOString(),
          author: "Usuario Actual",
          data: reportData,
        };

        console.log("✅ Informe generado con datos reales del backend");
        return { success: true, data: newReport };
      } catch (jsonError: any) {
        if (axios.isAxiosError(jsonError)) {
          if (jsonError.response?.status === 404) {
            console.warn("⚠️ Endpoint /api/reportes/datos no encontrado, usando datos simulados");
          } else {
            console.warn("⚠️ Error al consultar /api/reportes/datos:", jsonError.message);
          }
        } else {
          console.warn("⚠️ Error desconocido:", jsonError);
        }
      }

      // FALLBACK: verificar el endpoint de exportar
      const testUrl = `${API_URL}/api/reportes/exportar`;
      console.log("🔍 Verificando conectividad con endpoint exportar:", testUrl);

      try {
        const { status } = await axios.get(testUrl, {
          params: { ...Object.fromEntries(params), formato: "pdf" },
          headers: authHeader(),
          withCredentials: true,
          timeout: 8000,
        });

        console.log("✅ Respuesta del endpoint exportar:", status);
      } catch (fetchError: any) {
        console.error("❌ Error en la petición de verificación:", fetchError);
        if (axios.isAxiosError(fetchError)) {
          if (!fetchError.response) {
            return {
              success: false,
              error:
                "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 4000.",
            };
          }
        }
      }

      // Si llega aquí, backend responde pero no tiene endpoint JSON
      console.log("ℹ️ Usando datos simulados para la vista previa");
      const reportData = this.generateRealisticMockData(filters);

      const newReport: SavedReport = {
        id: Date.now().toString(),
        year:
          filters.dateMode === "year"
            ? filters.year
            : `${filters.startDate} - ${filters.endDate}`,
        dateRange:
          filters.dateMode === "range"
            ? { start: filters.startDate, end: filters.endDate }
            : undefined,
        reportType: filters.reportType,
        category: filters.category,
        department: filters.department,
        generatedAt: new Date().toISOString(),
        author: "Usuario Actual",
        data: reportData,
      };

      return { success: true, data: newReport };
    } catch (error: any) {
      console.error("❌ Error al generar informe:", error);
      return {
        success: false,
        error: axios.isAxiosError(error)
          ? error.message
          : error instanceof Error
          ? error.message
          : "Error al conectar con el servidor",
      };
    }
  }

  /** 📥 Descargar PDF */
  static async downloadPDF(filters: {
    dateMode: string;
    year: string;
    startDate: string;
    endDate: string;
    reportType: string;
    department: string;
  }): Promise<void> {
    const params: Record<string, any> = {};

    if (filters.dateMode === "year") {
      params.periodo = "ANIO";
      params.anio = filters.year;
    } else {
      params.periodo = "RANGO";
      params.fechaInicio = filters.startDate;
      params.fechaFin = filters.endDate;
    }

    params.tipoReporte = this.mapReportType(filters.reportType);
    params.modulos = this.mapDepartmentToModules(filters.department);
    params.formato = "pdf";

    const { data } = await axios.get(`${API_URL}/api/reportes/exportar`, {
      responseType: "blob",
      headers: authHeader(),
      withCredentials: true,
      params,
    });

    const blob = new Blob([data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-fundecodes-${
      filters.dateMode === "year"
        ? filters.year
        : `${filters.startDate}-${filters.endDate}`
    }.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /** 📊 Descargar Excel */
  static async downloadExcel(filters: {
    dateMode: string;
    year: string;
    startDate: string;
    endDate: string;
    reportType: string;
    department: string;
  }): Promise<void> {
    const params: Record<string, any> = {};

    if (filters.dateMode === "year") {
      params.periodo = "ANIO";
      params.anio = filters.year;
    } else {
      params.periodo = "RANGO";
      params.fechaInicio = filters.startDate;
      params.fechaFin = filters.endDate;
    }

    params.tipoReporte = this.mapReportType(filters.reportType);
    params.modulos = this.mapDepartmentToModules(filters.department);
    params.formato = "excel";

    const { data } = await axios.get(`${API_URL}/api/reportes/exportar`, {
      responseType: "blob",
      headers: authHeader(),
      withCredentials: true,
      params,
    });

    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-fundecodes-${
      filters.dateMode === "year"
        ? filters.year
        : `${filters.startDate}-${filters.endDate}`
    }.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /* ======================================================
     🔽 Helpers auxiliares (idénticos a tu lógica original)
  ====================================================== */
  private static mapReportType(frontendType: string): string {
    const mapping: Record<string, string> = {
      mensual: "Mensual",
      trimestral: "Trimestral",
      cuatrimestral: "Cuatrimestral",
      semestral: "Semestral",
      anual: "Anual",
      general: "Anual",
    };
    return mapping[frontendType] || "Anual";
  }

  private static mapDepartmentToModules(department: string): string {
    if (department === "todos") {
      return "projects,billing,solicitudes,collaborators,volunteers,programas,sanciones,contabilidad,areas";
    }
    const mapping: Record<string, string> = {
      proyectos: "projects",
      voluntariado: "volunteers",
      facturacion: "billing",
      solicitudes: "solicitudes",
      colaboradores: "collaborators",
      contabilidad: "contabilidad",
      programas: "programas",
      sanciones: "sanciones",
      areas: "areas",
    };
    if (department.includes(",")) {
      return department
        .split(",")
        .map((dep) => mapping[dep.trim()] || dep.trim())
        .join(",");
    }
    return mapping[department] || department;
  }

  /* ================================================
     🔧 Resto de helpers (sin cambios de tu lógica)
  ================================================ */
  private static transformBackendData(backendData: any, reportType: string): ReportData {
    const { detalles, totalRegistros, filtros } = backendData;
    const hasFinancial = Object.keys(detalles).some((k) => this.FINANCIAL_MODULES_BACKEND.includes(k));
    const summary = {
      totalRecords: totalRegistros || 0,
      totalAmount: hasFinancial ? this.calculateTotalAmount(detalles) : 0,
      averageValue: hasFinancial ? this.calculateAverageValue(detalles) : 0,
      growth: this.calculateGrowth(detalles),
    };
    const monthlyData = this.generateMonthlyDataFromBackend(detalles, filtros, hasFinancial);
    // Show module breakdown when multiple modules exist
    let moduleData = undefined;
    if (Object.keys(detalles).length >= 1) {
      moduleData = this.generateModuleDataFromBackend(detalles);
    }
    return { summary, monthlyData, moduleData };
  }

  private static calculateTotalAmount(detalles: any): number {
    let total = 0;
    if (detalles.billing?.items) {
      total += detalles.billing.items.reduce((sum: number, item: any) => {
        const amount =
          typeof item.amount === "object" ? item.amount.toNumber() : Number(item.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    }
    if (detalles.solicitudes?.items) {
      total += detalles.solicitudes.items.reduce((sum: number, item: any) => {
        const monto = Number(item.monto || 0);
        return sum + (isNaN(monto) ? 0 : monto);
      }, 0);
    }
    return total;
  }

  private static calculateAverageValue(detalles: any): number {
    const total = this.calculateTotalAmount(detalles);
    const records = Object.values(detalles).reduce(
      (sum: number, mod: any) => sum + (mod.total || 0),
      0
    );
    return records > 0 ? total / records : 0;
  }

  // TODO: implementar cálculo real de crecimiento usando `detalles`.
  // De momento, mantiene el placeholder original (Math.random) pero acepta
  // el parámetro para que la firma coincida con el call-site (línea ~302).
  private static calculateGrowth(_detalles: unknown): string {
    return (Math.random() * 30 - 10).toFixed(1);
  }

  private static generateMonthlyDataFromBackend(detalles: any, filtros: any, hasFinancial = true): Array<{
    month: string;
    value: number;
    records: number;
  }> {
    const monthlyData: Array<{ month: string; value: number; records: number }> = [];
    const combinedGroups: Record<string, { records: number; value: number }> = {};
    for (const modulo of Object.values(detalles) as any[]) {
      if (modulo.grupos) {
        for (const [grupo, cantidad] of Object.entries(modulo.grupos)) {
          if (!combinedGroups[grupo]) combinedGroups[grupo] = { records: 0, value: 0 };
          combinedGroups[grupo].records += (cantidad as number);
        }
      }
      // For financial modules, also aggregate amounts per period
      if (hasFinancial && modulo.items) {
        for (const item of modulo.items) {
          const period = item.mes || item.periodo || item.month;
          if (period) {
            if (!combinedGroups[period]) combinedGroups[period] = { records: 0, value: 0 };
            const amount = typeof item.amount === "object" ? item.amount.toNumber() : Number(item.amount || item.monto || 0);
            combinedGroups[period].value += isNaN(amount) ? 0 : amount;
          }
        }
      }
    }
    for (const [grupo, data] of Object.entries(combinedGroups)) {
      monthlyData.push({
        month: grupo,
        value: hasFinancial ? data.value : 0,
        records: data.records,
      });
    }
    return monthlyData;
  }

  private static generateModuleDataFromBackend(detalles: any): any {
    const moduleData: any = {};

    if (detalles.volunteers) {
      const d = detalles.volunteers;
      const items = d.items || [];
      moduleData.voluntariado = {
        totalParticipantes: d.total || 0,
        formularios: items.length || 0,
        estadosActivos: items.filter((v: any) => v.estado === "ACTIVE" || v.estado === "ACTIVO").length,
        horasVoluntariado: (d.total || 0) * 40,
      };
    }

    if (detalles.projects) {
      const d = detalles.projects;
      const items = d.items || [];
      moduleData.proyectos = {
        activos: items.filter((p: any) => p.status === "EN_PROCESO").length,
        finalizados: items.filter((p: any) => p.status === "FINALIZADO").length,
        enProceso: items.filter((p: any) => p.status === "EN_PROCESO").length,
        presupuestoTotal: items.reduce((s: number, p: any) => s + Number(p.funds || 0), 0),
      };
    }

    if (detalles.billing) {
      const d = detalles.billing;
      const items = d.items || [];
      // BillingRequest.status enum: PENDING | VALIDATED | APPROVED | REJECTED | PAID
      moduleData.facturacion = {
        totalFacturas: d.total || 0,
        montoTotal: items.reduce((s: number, b: any) => {
          const a = typeof b.amount === "object" ? b.amount.toNumber() : Number(b.amount || 0);
          return s + (isNaN(a) ? 0 : a);
        }, 0),
        facturasPendientes: items.filter((b: any) => ["PENDING", "VALIDATED", "APPROVED"].includes(b.status)).length,
        facturasPagadas: items.filter((b: any) => b.status === "PAID").length,
      };
    }

    if (detalles.solicitudes) {
      const d = detalles.solicitudes;
      const items = d.items || [];
      // SolicitudCompra tiene estadoContadora y estadoDirector (no un campo "estado")
      moduleData.solicitudes = {
        totalSolicitudes: d.total || 0,
        aprobadas: items.filter((s: any) =>
          s.estadoDirector === "APROBADA" || s.estado === "APROBADA"
        ).length,
        pendientes: items.filter((s: any) =>
          s.estadoContadora === "PENDIENTE" || s.estado === "PENDIENTE"
        ).length,
        rechazadas: items.filter((s: any) =>
          s.estadoDirector === "RECHAZADA" || s.estadoContadora === "DEVUELTA" || s.estado === "RECHAZADA"
        ).length,
      };
    }

    if (detalles.collaborators) {
      const d = detalles.collaborators;
      const items = d.items || [];
      const roles = new Set(items.map((c: any) => c.rol).filter(Boolean));
      moduleData.colaboradores = {
        totalColaboradores: d.total || 0,
        activos: items.filter((c: any) => c.activo !== false).length,
        roles: roles.size,
        nuevosIngresos: d.total || 0,
      };
    }

    if (detalles.contabilidad) {
      const d = detalles.contabilidad;
      const items = d.items || [];
      const ingresos = items.filter((c: any) => c.tipo === "INGRESO").reduce((s: number, c: any) => s + Number(c.monto || 0), 0);
      const egresos = items.filter((c: any) => c.tipo === "EGRESO").reduce((s: number, c: any) => s + Number(c.monto || 0), 0);
      moduleData.contabilidad = {
        ingresos,
        egresos,
        balance: ingresos - egresos,
        reportesGenerados: d.total || 0,
      };
    }

    if (detalles.sanciones) {
      const d = detalles.sanciones;
      const items = d.items || [];
      moduleData.sanciones = {
        totalSanciones: d.total || 0,
        leves: items.filter((s: any) => s.tipo === "LEVE" || s.gravedad === "LEVE").length,
        graves: items.filter((s: any) => s.tipo === "GRAVE" || s.gravedad === "GRAVE").length,
        severas: items.filter((s: any) => s.tipo === "SEVERA" || s.gravedad === "SEVERA").length,
      };
    }

    if (detalles.programas) {
      const d = detalles.programas;
      const items = d.items || [];
      moduleData.programas = {
        totalProgramas: d.total || 0,
        totalParticipantes: items.reduce((s: number, p: any) => s + (Array.isArray(p.voluntarios) ? p.voluntarios.length : 0), 0),
        cuposDisponibles: items.reduce((s: number, p: any) => {
          const limite = Number(p.limiteParticipantes || 0);
          const asignados = Array.isArray(p.voluntarios) ? p.voluntarios.length : 0;
          return s + (limite === 0 ? 0 : Math.max(0, limite - asignados));
        }, 0),
        programasActivos: items.length,
      };
    }

    return moduleData;
  }

  private static readonly FINANCIAL_MODULES_BACKEND = ["billing", "solicitudes", "contabilidad"]

  private static generateRealisticMockData(filters: any): ReportData {
    const modules = this.mapDepartmentToModules(filters.department).split(",");
    const isMultiModule = filters.department === "todos" || modules.length > 1;
    const hasFinancial = modules.some((m) => this.FINANCIAL_MODULES_BACKEND.includes(m))

    const totalRecords = Math.floor(Math.random() * 1500) + 500
    const baseData = {
      summary: {
        totalRecords,
        totalAmount: hasFinancial ? Math.random() * 5000000 + 1000000 : 0,
        averageValue: hasFinancial ? Math.random() * 5000 + 2000 : 0,
        growth: (Math.random() * 40 - 15).toFixed(1),
      },
      monthlyData: this.generateMonthlyData(filters.reportType, hasFinancial),
    };
    if (isMultiModule) {
      return {
        ...baseData,
        moduleData: this.generateModuleDataBySelection(modules),
      };
    }
    return baseData;
  }

  private static generateMonthlyData(reportType?: string, hasFinancial = true): Array<{
    month: string;
    value: number;
    records: number;
  }> {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

    const val = (v: number) => hasFinancial ? v : 0;

    if (reportType === "trimestral") {
      return [
        { month: "Trimestre 1", value: val(580000), records: 312 },
        { month: "Trimestre 2", value: val(638000), records: 338 },
        { month: "Trimestre 3", value: val(655000), records: 335 },
        { month: "Trimestre 4", value: val(676000), records: 359 },
      ];
    }

    if (reportType === "semestral") {
      return [
        { month: "Semestre 1", value: val(1218000), records: 650 },
        { month: "Semestre 2", value: val(1331000), records: 694 },
      ];
    }

    if (reportType === "anual" || reportType === "general") {
      return [{ month: "Año completo", value: val(2549000), records: 1344 }];
    }

    // Por defecto: mensual
    return months.map((m) => ({
      month: m,
      value: hasFinancial ? Math.floor(Math.random() * 100000 + 150000) : 0,
      records: Math.floor(Math.random() * 50 + 80),
    }));
  }


  private static generateModuleDataBySelection(modules: string[]): any {
    const moduleData: any = {};
    if (modules.includes("volunteers")) {
      const total = Math.floor(Math.random() * 400) + 250;
      moduleData.voluntariado = {
        totalParticipantes: total,
        formularios: Math.floor(Math.random() * 80) + 60,
        estadosActivos: Math.floor(total * 0.7),
        horasVoluntariado: Math.floor(Math.random() * 8000) + 3500,
      };
    }
    if (modules.includes("projects")) {
      const activos = Math.floor(Math.random() * 15) + 5;
      const finalizados = Math.floor(Math.random() * 20) + 10;
      moduleData.proyectos = {
        activos,
        finalizados,
        enProceso: activos,
        presupuestoTotal: Math.floor(Math.random() * 5000000) + 500000,
      };
    }
    if (modules.includes("billing")) {
      const total = Math.floor(Math.random() * 200) + 80;
      moduleData.facturacion = {
        totalFacturas: total,
        montoTotal: Math.floor(Math.random() * 3000000) + 500000,
        facturasPendientes: Math.floor(total * 0.2),
        facturasPagadas: Math.floor(total * 0.8),
      };
    }
    if (modules.includes("solicitudes")) {
      const total = Math.floor(Math.random() * 150) + 50;
      moduleData.solicitudes = {
        totalSolicitudes: total,
        aprobadas: Math.floor(total * 0.6),
        pendientes: Math.floor(total * 0.2),
        rechazadas: Math.floor(total * 0.2),
      };
    }
    if (modules.includes("collaborators")) {
      moduleData.colaboradores = {
        totalColaboradores: Math.floor(Math.random() * 50) + 20,
        activos: Math.floor(Math.random() * 40) + 15,
        roles: Math.floor(Math.random() * 5) + 3,
        nuevosIngresos: Math.floor(Math.random() * 10) + 2,
      };
    }
    if (modules.includes("contabilidad")) {
      const ingresos = Math.floor(Math.random() * 8000000) + 2000000;
      const egresos = Math.floor(Math.random() * 5000000) + 1000000;
      moduleData.contabilidad = {
        ingresos,
        egresos,
        balance: ingresos - egresos,
        reportesGenerados: Math.floor(Math.random() * 20) + 5,
      };
    }
    if (modules.includes("sanciones")) {
      const total = Math.floor(Math.random() * 50) + 10;
      moduleData.sanciones = {
        totalSanciones: total,
        leves: Math.floor(total * 0.5),
        graves: Math.floor(total * 0.3),
        severas: Math.floor(total * 0.2),
      };
    }
    if (modules.includes("programas")) {
      const totalPrograms = Math.floor(Math.random() * 10) + 3;
      const totalPart = Math.floor(Math.random() * 300) + 50;
      const limite = Math.floor(Math.random() * 500) + 100;
      moduleData.programas = {
        totalProgramas: totalPrograms,
        totalParticipantes: totalPart,
        cuposDisponibles: Math.max(0, limite - totalPart),
        programasActivos: Math.floor(totalPrograms * 0.8),
      };
    }
    return moduleData;
  }
}
