"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, CheckCircle, XCircle } from "lucide-react"
import type { Document } from "../types"
import { DocumentService } from "../services/document-service"
import { ProjectsService } from "../services/projects-service"

export function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [filters, setFilters] = useState({ programa: "todos", mes: "todos" })
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState({ programa: "", mes: "", año: new Date().getFullYear() })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const programas = Array.from(new Set(documents.map((d) => d.programa))).sort()

  async function load() {
    setLoading(true)
    try {
      const list = await DocumentService.getDocuments()
      setDocuments(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    ProjectsService.list()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    let filtered = documents
    if (filters.programa !== "todos") filtered = filtered.filter((doc) => doc.programa === filters.programa)
    if (filters.mes !== "todos") filtered = filtered.filter((doc) => doc.mes === filters.mes)
    setFilteredDocuments(filtered)
  }, [filters, documents])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return setMessage({ type: "error", text: "Por favor selecciona un archivo" })
    if (!uploadData.programa) return setMessage({ type: "error", text: "Por favor selecciona un proyecto" })
    if (!uploadData.mes) return setMessage({ type: "error", text: "Por favor selecciona un mes" })
    if (file.size > 10 * 1024 * 1024) return setMessage({ type: "error", text: "El archivo es demasiado grande. Máximo 10MB." })

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    if (!allowedTypes.includes(file.type)) return setMessage({ type: "error", text: "Tipo de archivo no permitido. Solo PDF, JPG, PNG y Excel." })

    try {
      setLoading(true)
      await DocumentService.uploadDocument(file, { programa: uploadData.programa, mes: uploadData.mes, año: uploadData.año } as any)
      setIsDialogOpen(false)
      setMessage({ type: "success", text: "Documento subido correctamente" })
      if (fileInputRef.current) fileInputRef.current.value = ""
      setUploadData({ programa: "", mes: "", año: new Date().getFullYear() })
      await load()
    } catch {
      setMessage({ type: "error", text: "Error al subir el documento. Inténtalo nuevamente." })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (doc: Document) => {
    try {
      const link = document.createElement("a")
      link.href = doc.url
      link.download = doc.nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setMessage({ type: "success", text: `Descargando ${doc.nombre}...` })
    } catch {
      setMessage({ type: "error", text: "Error al descargar el documento" })
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  const formatDate = (date: Date) => new Intl.DateTimeFormat("es-CO").format(new Date(date))

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Documentos</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setUploadData({ programa: "", mes: "", año: new Date().getFullYear() }); setMessage(null) } }}>
            <DialogTrigger asChild>
              {/* Botón 1: azul */}
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subir Nuevo Documento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">Archivo *</Label>
                  <Input ref={fileInputRef} id="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx" required />
                  <p className="text-sm text-muted-foreground mt-1">Formatos permitidos: PDF, JPG, PNG, Excel. Máximo 10MB.</p>
                </div>

                <div>
                  <Label htmlFor="proyecto">Proyecto *</Label>
                  <select
                    id="proyecto"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={uploadData.programa}
                    onChange={(e) => setUploadData({ ...uploadData, programa: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.title}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="mes">Mes *</Label>
                  <select
                    id="mes"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={uploadData.mes}
                    onChange={(e) => setUploadData({ ...uploadData, mes: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar mes</option>
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="anio">Año</Label>
                  <Input
                    id="anio"
                    type="number"
                    min={2020}
                    max={2030}
                    value={uploadData.año}
                    onChange={(e) => setUploadData({ ...uploadData, año: Number(e.target.value) })}
                    required
                  />
                </div>

                {/* Botón 2: azul */}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? "Subiendo..." : "Subir Documento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-md mt-3 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="flex gap-6 flex-wrap items-end mt-4">
          <div className="min-w-[200px]">
            <Label className="text-sm font-medium mb-2 block">Programa</Label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.programa}
              onChange={(e) => setFilters({ ...filters, programa: e.target.value })}
            >
              <option value="todos">Todos los programas</option>
              {programas.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[180px]">
            <Label className="text-sm font-medium mb-2 block">Mes</Label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.mes}
              onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
            >
              <option value="todos">Todos los meses</option>
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          Mostrando {filteredDocuments.length} de {documents.length} documentos
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando documentos...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Mes</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Fecha Subida</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {documents.length === 0 ? "No hay documentos registrados" : "No se encontraron documentos con los filtros seleccionados"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc.nombre}
                    </TableCell>
                    <TableCell>{doc.programa}</TableCell>
                    <TableCell>{doc.mes}</TableCell>
                    <TableCell>{doc.año}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.tipo}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.tamaño)}</TableCell>
                    <TableCell>{formatDate(doc.fechaSubida as any)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(doc)} title={`Descargar ${doc.nombre}`} className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}