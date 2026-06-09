"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FileText, Download, AlertCircle, Loader2, X, FileSpreadsheet, CheckCircle2, Calendar } from "lucide-react"
import { useReportGenerator } from "../hooks/use-report-generator"
import ReportPreview from "./report-preview"

export default function ReportGenerator() {
  const {
    dateMode,
    year,
    startDate,
    endDate,
    reportType,
    department,
    status,
    reportData,
    errorMessage,
    progress,
    isFormValid,
    setDateMode,
    setYear,
    setStartDate,
    setEndDate,
    setReportType,
    setDepartment,
    clearFilters,
    generateReport,
    downloadPDF,
    downloadExcel,
  } = useReportGenerator()

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const getPreviewDescription = () => {
    switch (status) {
      case "idle":
        return "Configura los parámetros para ver la vista previa"
      case "generating":
        return "Generando informe desde el servidor..."
      case "success":
        return "Informe listo para descargar"
      case "error":
        return errorMessage || "Error al generar el informe"
      case "no-data":
        return "No se encontraron datos para los filtros seleccionados"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel de configuración */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <FileText className="h-5 w-5 text-blue-600" />
                Configuración
              </CardTitle>
              <CardDescription className="text-slate-600">
                Completa todos los campos para generar el informe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Período */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Período</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={dateMode === "year" ? "default" : "outline"}
                    className={`flex-1 ${
                      dateMode === "year"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setDateMode("year")}
                  >
                    Año
                  </Button>
                  <Button
                    type="button"
                    variant={dateMode === "range" ? "default" : "outline"}
                    className={`flex-1 ${
                      dateMode === "range"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setDateMode("range")}
                  >
                    Rango
                  </Button>
                </div>
              </div>

              {/* Año o Rango de fechas */}
              {dateMode === "year" ? (
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-slate-700 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Año del informe *
                  </Label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full border border-slate-300 rounded-md h-10 px-3 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona un año</option>
                    {years.map((y) => (
                      <option key={y} value={y.toString()}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-slate-700 font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha inicio *
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white border-slate-300 text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-slate-700 font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha fin *
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white border-slate-300 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Tipo de reporte */}
              <div className="space-y-2">
                <Label htmlFor="report-type" className="text-slate-700 font-medium">
                  Tipo de reporte *
                </Label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-slate-300 rounded-md h-10 px-3 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="cuatrimestral">Cuatrimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              {/* Módulos - Selección múltiple */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Módulos * <span className="text-xs font-normal text-slate-500">(selecciona uno o varios)</span>
                </Label>
                
                <div className="border border-slate-300 rounded-md bg-white">
                  <div className="divide-y divide-slate-100">
                    {/* Opción "Todos" - destacada */}
                    <label className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors bg-slate-50">
                      <input
                        type="checkbox"
                        checked={!!(department === "todos" || (department && department.split(",").length === 9))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDepartment("todos")
                          } else {
                            setDepartment("")
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-slate-400 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="text-sm text-slate-800 font-semibold">Todos los módulos</span>
                    </label>

                    {/* Módulos individuales */}
                    {[
                      { value: "voluntariado", label: "Voluntariado" },
                      { value: "programas", label: "Programas de voluntariado" },
                      { value: "sanciones", label: "Sanciones" },
                      { value: "proyectos", label: "Proyectos" },
                      { value: "facturacion", label: "Facturación" },
                      { value: "solicitudes", label: "Solicitudes" },
                      { value: "colaboradores", label: "Colaboradores" },
                      { value: "contabilidad", label: "Contabilidad" },
                      { value: "areas", label: "Áreas" },
                    ].map((mod) => {
                      const isChecked = department === "todos" || (department && department.split(",").includes(mod.value))
                      const isDisabled = department === "todos"
                      
                      return (
                        <label 
                          key={mod.value} 
                          className={`flex items-center gap-3 py-2.5 px-3 pl-10 cursor-pointer transition-colors ${
                            isDisabled 
                              ? "bg-slate-50/50 opacity-50 cursor-not-allowed" 
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!isChecked}
                            disabled={isDisabled}
                            onChange={(e) => {
                              const current = department && department !== "todos" ? department.split(",") : []
                              if (e.target.checked) {
                                const newSelection = [...current, mod.value]
                                setDepartment(newSelection.join(","))
                              } else {
                                const newSelection = current.filter(d => d !== mod.value)
                                setDepartment(newSelection.join(","))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 border-slate-400 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed flex-shrink-0"
                          />
                          <span className="text-sm text-slate-700">{mod.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Contador y feedback */}
                <div className="text-xs mt-1.5">
                  {department === "todos" ? (
                    <p className="text-blue-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Todos los módulos seleccionados
                    </p>
                  ) : department ? (
                    <p className="text-slate-700 font-medium">
                      {department.split(",").length} de 9 módulos seleccionados
                    </p>
                  ) : (
                    <p className="text-slate-500">Ningún módulo seleccionado</p>
                  )}
                </div>
              </div>

              {/* Alerta de validación */}
              {!isFormValid && (
                <Alert className="border-slate-300 bg-slate-50">
                  <AlertCircle className="h-4 w-4 text-slate-600" />
                  <AlertDescription className="text-sm text-slate-600">
                    Completa todos los campos para continuar
                  </AlertDescription>
                </Alert>
              )}

              {/* Progress bar */}
              {status === "generating" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Consultando servidor...</span>
                    <span className="font-medium text-slate-800">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Botones principales */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={generateReport}
                  disabled={!isFormValid || status === "generating"}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {status === "generating" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generar informe
                    </>
                  )}
                </Button>

                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  disabled={status === "generating"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Botones de descarga */}
              {status === "success" && reportData && (
                <div className="space-y-2">
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  <Button
                    onClick={downloadExcel}
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar a Excel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas de estado */}
          {status === "success" && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-700">
                Informe generado exitosamente
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700">
                {errorMessage || "Error al generar el informe"}
              </AlertDescription>
            </Alert>
          )}

          {status === "no-data" && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-700">
                No se encontraron datos para los filtros seleccionados. Intenta con otros parámetros.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Vista previa */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Vista previa</CardTitle>
              <CardDescription className="text-slate-600">
                {getPreviewDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "idle" && (
                <div className="flex h-[600px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-4 text-sm text-slate-600">
                      Selecciona los parámetros para generar el informe
                    </p>
                  </div>
                </div>
              )}

              {status === "generating" && (
                <div className="flex h-[600px] items-center justify-center rounded-lg border border-slate-300 bg-slate-50">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                    <p className="mt-4 text-sm font-medium text-slate-800">Generando informe</p>
                    <p className="mt-1 text-xs text-slate-600">Consultando la base de datos...</p>
                    <div className="mx-auto mt-4 w-48">
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                </div>
              )}

              {status === "success" && reportData && (
                <ReportPreview data={reportData} />
              )}

              {status === "error" && (
                <div className="flex h-[600px] items-center justify-center rounded-lg border border-red-300 bg-red-50">
                  <div className="text-center max-w-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
                    <p className="mt-4 text-sm font-medium text-slate-800">Error al generar el informe</p>
                    <p className="mt-2 text-xs text-slate-600">{errorMessage}</p>
                    <Button 
                      onClick={clearFilters}
                      variant="outline"
                      className="mt-4"
                    >
                      Intentar nuevamente
                    </Button>
                  </div>
                </div>
              )}

              {status === "no-data" && (
                <div className="flex h-[600px] items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50">
                  <div className="text-center max-w-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
                    <p className="mt-4 text-sm font-medium text-slate-800">No hay datos disponibles</p>
                    <p className="mt-2 text-xs text-slate-600">
                      No se encontraron registros para los filtros seleccionados. 
                      Intenta con otros parámetros o un rango de fechas diferente.
                    </p>
                    <Button 
                      onClick={clearFilters}
                      variant="outline"
                      className="mt-4"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
