"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ReportGenerator from "./components/report-generator"
import ReportHistory from "./components/report-history"
import { useReportGenerator } from "./hooks/use-report-generator"

export default function RecapitulacionPage() {
  const { savedReports, loadReport } = useReportGenerator()

  const handleDeleteReport = (reportId: string) => {
    console.log("Eliminar reporte:", reportId)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Nav bar VoluntariadoNav-style ── */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Título centrado */}
          <div className="text-center py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Recapitulación Anual
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Genera informes consolidados de todos los módulos del sistema.
            </p>
          </div>

          {/* Desktop — back izq */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-center h-14 pb-3">
              <Link href="/admin" className="absolute left-0">
                <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden pb-4">
            <Link href="/admin">
              <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ReportGenerator />

        {savedReports.length > 0 && (
          <div className="mt-8">
            <ReportHistory
              reports={savedReports}
              onLoadReport={loadReport}
              onDeleteReport={handleDeleteReport}
            />
          </div>
        )}
      </div>
    </main>
  )
}