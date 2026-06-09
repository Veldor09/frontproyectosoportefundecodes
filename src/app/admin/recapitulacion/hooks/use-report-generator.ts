// src/app/admin/recapitulacion/hooks/use-report-generator.ts
"use client"

import { useState } from "react"
import type { ReportStatus, DateMode, SavedReport } from "../types/report"
import { ReportService } from "../services/report-service"

export function useReportGenerator() {
  const [dateMode, setDateMode] = useState<DateMode>("year")
  const [year, setYear] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [reportType, setReportType] = useState<string>("")
  const [department, setDepartment] = useState<string>("")
  const [status, setStatus] = useState<ReportStatus>("idle")
  const [reportData, setReportData] = useState<SavedReport | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [progress, setProgress] = useState<number>(0)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  const isFormValid =
    reportType !== "" &&
    department !== "" &&
    (dateMode === "year" ? year !== "" : startDate !== "" && endDate !== "")

  const clearFilters = () => {
    setYear("")
    setStartDate("")
    setEndDate("")
    setReportType("")
    setDepartment("")
    setStatus("idle")
    setReportData(null)
    setErrorMessage("")
    setProgress(0)
  }

  const generateReport = async () => {
    setStatus("generating")
    setErrorMessage("")
    setProgress(0)

    // Simulación de progreso
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const result = await ReportService.generateReport({
        dateMode,
        year,
        startDate,
        endDate,
        reportType,
        category: "general",
        department,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!result.success) {
        if (result.error === "no-data") {
          setStatus("no-data")
          setReportData(null)
          setErrorMessage("No se encontraron datos para los filtros seleccionados")
        } else {
          setStatus("error")
          setErrorMessage(result.error || "Error desconocido al generar el informe")
          setReportData(null)
        }
      } else if (result.data) {
        setStatus("success")
        setReportData(result.data)
        setSavedReports((prev) => [result.data!, ...prev.slice(0, 9)]) // Mantener últimos 10
      }
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(0)
      setStatus("error")
      setErrorMessage("Error inesperado al generar el informe")
      console.error("Error en generateReport:", error)
    }
  }

  const downloadPDF = async () => {
    if (!reportData) return

    try {
      await ReportService.downloadPDF({
        dateMode,
        year: reportData.year,
        startDate,
        endDate,
        reportType: reportData.reportType,
        department: reportData.department || "",
      })
    } catch (error) {
      setStatus("error")
      setErrorMessage("Error al descargar el PDF")
      console.error("Error al descargar PDF:", error)
    }
  }

  const downloadExcel = async () => {
    if (!reportData) return

    try {
      await ReportService.downloadExcel({
        dateMode,
        year: reportData.year,
        startDate,
        endDate,
        reportType: reportData.reportType,
        department: reportData.department || "",
      })
    } catch (error) {
      setStatus("error")
      setErrorMessage("Error al descargar el archivo Excel")
      console.error("Error al descargar Excel:", error)
    }
  }

  const loadReport = (report: SavedReport) => {
    setReportData(report)
    setStatus("success")
    setYear(report.year)
    setReportType(report.reportType)
    setDepartment(report.department || "")
    
    if (report.dateRange) {
      setDateMode("range")
      setStartDate(report.dateRange.start)
      setEndDate(report.dateRange.end)
    } else {
      setDateMode("year")
    }
  }

  return {
    // Estados
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
    savedReports,
    isFormValid,
    // Setters
    setDateMode,
    setYear,
    setStartDate,
    setEndDate,
    setReportType,
    setDepartment,
    // Acciones
    clearFilters,
    generateReport,
    downloadPDF,
    downloadExcel,
    loadReport,
  }
}