// src/app/admin/recapitulacion/types/report.ts

export type ReportStatus = "idle" | "generating" | "success" | "error" | "no-data"

export type DateMode = "year" | "range"

export interface ReportData {
  summary: {
    totalRecords: number
    totalAmount: number
    averageValue: number
    growth: string | number
  }
  monthlyData: Array<{
    month: string
    value: number
    records: number
  }>
  moduleData?: {
    voluntariado?: {
      totalParticipantes: number
      formularios: number
      estadosActivos: number
      horasVoluntariado: number
    }
    proyectos?: {
      activos: number
      finalizados: number
      enProceso: number
      presupuestoTotal: number
    }
    facturacion?: {
      totalFacturas: number
      montoTotal: number
      facturasPendientes: number
      facturasPagadas: number
    }
    solicitudes?: {
      totalSolicitudes: number
      aprobadas: number
      pendientes: number
      rechazadas: number
    }
    colaboradores?: {
      totalColaboradores: number
      activos: number
      roles: number
      nuevosIngresos: number
    }
    contabilidad?: {
      ingresos: number
      egresos: number
      balance: number
      reportesGenerados: number
    }
    sanciones?: {
      totalSanciones: number
      leves: number
      graves: number
      severas: number
    }
    programas?: {
      totalProgramas: number
      totalParticipantes: number
      cuposDisponibles: number
      programasActivos: number
    }
  }
}

export interface SavedReport {
  id: string
  year: string
  dateRange?: {
    start: string
    end: string
  }
  reportType: string
  category?: string
  department?: string
  generatedAt: string
  author: string
  data: ReportData
}