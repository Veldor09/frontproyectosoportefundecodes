"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Download, Calendar, User, FileText, Trash2 } from "lucide-react"
import type { SavedReport } from "../types/report"

interface ReportHistoryProps {
  reports: SavedReport[]
  onLoadReport: (report: SavedReport) => void
  onDeleteReport?: (reportId: string) => void
}

export default function ReportHistory({ reports, onLoadReport, onDeleteReport }: ReportHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const reportTypeNames: Record<string, string> = {
    proyectos: "Proyectos",
    voluntariado: "Voluntariado",
    programas: "Programas de voluntariado",
    sanciones: "Sanciones",
    facturacion: "Facturación",
    solicitudes: "Solicitudes",
    colaboradores: "Colaboradores",
    contabilidad: "Contabilidad",
    mensual: "Mensual",
    trimestral: "Trimestral",
    cuatrimestral: "Cuatrimestral",
    semestral: "Semestral",
    anual: "Anual",
    general: "General",
  }

  if (reports.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <History className="h-5 w-5 text-primary" />
            Historial de Informes
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            No hay informes generados aún
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Los informes que generes aparecerán aquí
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <History className="h-5 w-5 text-primary" />
          Historial de Informes
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Informes generados recientemente - {reports.length} {reports.length === 1 ? "informe" : "informes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-medium text-foreground truncate">
                    {reportTypeNames[report.reportType] || report.reportType} - {report.year}
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{formatDate(report.generatedAt)}</span>
                  </div>
                  {report.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span>{report.author}</span>
                    </div>
                  )}
                  {report.department && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Módulos:</span>
                      <span className="truncate max-w-[200px]">
                        {report.department === "todos" 
                          ? "Todos" 
                          : report.department.split(",").map(d => reportTypeNames[d] || d).join(", ")
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => onLoadReport(report)}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Ver
                </Button>
                {onDeleteReport && (
                  <Button
                    onClick={() => onDeleteReport(report.id)}
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}