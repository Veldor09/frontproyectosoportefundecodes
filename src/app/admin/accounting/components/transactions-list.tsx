"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TransactionService } from "../services/transaction-service"
import { ProjectsService } from "../services/projects-service"
import type { Transaction } from "../types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface TransactionUI {
  id: string
  fecha: string
  tipo: "ingreso" | "egreso"
  categoria: string
  descripcion: string
  programa: string
  monto: number
  moneda: "CRC" | "USD" | "EUR"
  fechaCreacion: string
}

interface Filters {
  tipo: string
  categoria: string
  fechaDesde: string
  fechaHasta: string
}

const MAX_CATEGORIA_CHARS = 50
const MAX_DESCRIPCION_CHARS = 120

interface TransactionsListProps {
  selectedProject?: string
  onDataChange?: () => void
}

const TransactionsList = ({ selectedProject, onDataChange }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<TransactionUI[]>([])
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([])
  const [filters, setFilters] = useState<Filters>({ tipo: "all", categoria: "", fechaDesde: "", fechaHasta: "" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [newTransaction, setNewTransaction] = useState<Partial<TransactionUI>>({
    tipo: "ingreso",
    fecha: new Date().toISOString().split("T")[0],
    categoria: "",
    descripcion: "",
    monto: 0,
    programa: "",
    moneda: "CRC",
  })

  async function load() {
    const data = await TransactionService.getTransactions()
    setTransactions(
      data.map((t) => ({
        id: t.id,
        tipo: t.tipo,
        categoria: t.categoria,
        descripcion: t.descripcion,
        programa: t.programa ?? "",
        monto: t.monto,
        moneda: (["CRC", "USD", "EUR"].includes(t.moneda) ? t.moneda : "CRC") as "CRC" | "USD" | "EUR",
        fecha: new Date(t.fecha).toISOString().slice(0, 10),
        fechaCreacion: new Date(t.fechaCreacion).toISOString(),
      })),
    )
  }

  useEffect(() => {
    load()
    ProjectsService.list()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setNewTransaction((prev) => ({ ...prev, programa: selectedProject }))
  }, [selectedProject])

  const projectTitles = useMemo(() => projects.map((p) => p.title), [projects])

  const proyectos = useMemo(() => {
    return projectTitles.length > 0
      ? projectTitles
      : Array.from(new Set(transactions.map((t) => t.programa))).filter(Boolean)
  }, [projectTitles, transactions])

  const categorias = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.categoria))).filter(Boolean),
    [transactions],
  )

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesProject = !selectedProject || transaction.programa === selectedProject
    const matchesTipo = filters.tipo === "all" || transaction.tipo === filters.tipo
    const matchesCategoria =
      !filters.categoria || transaction.categoria.toLowerCase().includes(filters.categoria.toLowerCase())
    const matchesFechaDesde = !filters.fechaDesde || transaction.fecha >= filters.fechaDesde
    const matchesFechaHasta = !filters.fechaHasta || transaction.fecha <= filters.fechaHasta
    return matchesProject && matchesTipo && matchesCategoria && matchesFechaDesde && matchesFechaHasta
  })

  const categoriaCharCount = (newTransaction.categoria || "").length
  const descripcionCharCount = (newTransaction.descripcion || "").length

  function limitPaste(
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof Partial<TransactionUI>,
    max: number,
  ) {
    const pasted = e.clipboardData.getData("text") ?? ""
    const current = (newTransaction[field] as string) ?? ""
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    let selectionLen = 0

    try {
      if (typeof target.selectionStart === "number" && typeof target.selectionEnd === "number") {
        selectionLen = Math.max(0, target.selectionEnd - target.selectionStart)
      }
    } catch {}

    const resulting = current.length - selectionLen + pasted.length
    if (resulting > max) {
      e.preventDefault()
      const room = Math.max(0, max - (current.length - selectionLen))
      const clipped = pasted.slice(0, room)

      let valueAfter = ""
      if (typeof target.selectionStart === "number" && typeof target.selectionEnd === "number") {
        const before = current.slice(0, target.selectionStart)
        const after = current.slice(target.selectionEnd)
        valueAfter = before + clipped + after
      } else {
        valueAfter = (current + clipped).slice(0, max)
      }

      setNewTransaction({ ...newTransaction, [field]: valueAfter })

      if (formErrors[field as string]) {
        setFormErrors({ ...formErrors, [field as string]: "" })
      }
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    const categoriaText = newTransaction.categoria?.trim() || ""
    if (!categoriaText) {
      errors.categoria = "La categoría es requerida"
    } else if (categoriaText.length < 2) {
      errors.categoria = "La categoría debe tener al menos 2 caracteres"
    } else if (categoriaText.length > MAX_CATEGORIA_CHARS) {
      errors.categoria = `La categoría excede el límite de ${MAX_CATEGORIA_CHARS} caracteres`
    }

    const descripcionText = newTransaction.descripcion?.trim() || ""
    if (!descripcionText) {
      errors.descripcion = "La descripción es requerida"
    } else if (descripcionText.length < 2) {
      errors.descripcion = "La descripción debe tener al menos 2 caracteres"
    } else if (descripcionText.length > MAX_DESCRIPCION_CHARS) {
      errors.descripcion = `La descripción excede el límite de ${MAX_DESCRIPCION_CHARS} caracteres`
    }

    if (!newTransaction.programa?.trim()) {
      errors.programa = "El proyecto es requerido"
    }

    if (!newTransaction.monto || newTransaction.monto <= 0) {
      errors.monto = "El monto debe ser mayor a 0"
    }

    if (!newTransaction.fecha) {
      errors.fecha = "La fecha es requerida"
    }

    if (!newTransaction.moneda) {
      errors.moneda = "La moneda es requerida"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (isEditing) {
      const payload: Partial<Transaction> = {
        tipo: newTransaction.tipo!,
        categoria: newTransaction.categoria!,
        descripcion: newTransaction.descripcion!,
        monto: Number(newTransaction.monto!),
        fecha: new Date(newTransaction.fecha!),
        programa: newTransaction.programa!,
        moneda: newTransaction.moneda!,
      }
      await TransactionService.updateTransaction(editingId!, { ...payload })
    } else {
      const payload: Omit<Transaction, "id" | "fechaCreacion"> = {
        tipo: newTransaction.tipo as "ingreso" | "egreso",
        categoria: newTransaction.categoria!,
        descripcion: newTransaction.descripcion!,
        monto: Number(newTransaction.monto!),
        fecha: new Date(newTransaction.fecha!),
        programa: newTransaction.programa!,
        moneda: newTransaction.moneda!,
      }
      await TransactionService.createTransaction(payload)
    }

    await load()
    onDataChange?.()
    setIsDialogOpen(false)
    setIsEditing(false)
    setEditingId(null)
    setFormErrors({})
    setNewTransaction({
      tipo: "ingreso",
      fecha: new Date().toISOString().split("T")[0],
      categoria: "",
      descripcion: "",
      monto: 0,
      programa: "",
      moneda: "CRC",
    })
  }

  const handleEdit = (t: TransactionUI) => {
    setNewTransaction({ ...t })
    setIsEditing(true)
    setEditingId(t.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await TransactionService.deleteTransaction(id)
    await load()
    onDataChange?.()
  }

  const formatCurrency = (amount: number, currency = "CRC") => {
    const currencyConfig = {
      CRC: { locale: "es-CR", currency: "CRC" },
      USD: { locale: "en-US", currency: "USD" },
      EUR: { locale: "es-ES", currency: "EUR" },
    }
    const config = currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.CRC
    return new Intl.NumberFormat(config.locale, { style: "currency", currency: config.currency }).format(amount)
  }

  const formatDate = (dateString: string) => new Intl.DateTimeFormat("es-ES").format(new Date(dateString))

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Transacciones</CardTitle>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                setIsEditing(false)
                setEditingId(null)
                setFormErrors({})
                setNewTransaction({
                  tipo: "ingreso",
                  fecha: new Date().toISOString().split("T")[0],
                  categoria: "",
                  descripcion: "",
                  monto: 0,
                  programa: "",
                  moneda: "CRC",
                })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>{isEditing ? "Editar Transacción" : "Agregar Nueva Transacción"}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 pr-2">
                <div className="space-y-4 pb-4">
                  <div>
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      type="date"
                      value={newTransaction.fecha}
                      onChange={(e) => setNewTransaction({ ...newTransaction, fecha: e.target.value })}
                      className={formErrors.fecha ? "border-red-500" : ""}
                    />
                    {formErrors.fecha && <p className="text-red-500 text-sm mt-1">{formErrors.fecha}</p>}
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <select
                      className="w-full border rounded-md h-9 px-2 text-sm"
                      value={newTransaction.tipo}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, tipo: e.target.value as "ingreso" | "egreso" })
                      }
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="categoria">Categoría</Label>
                      <span className="text-xs text-slate-500">
                        {categoriaCharCount}/{MAX_CATEGORIA_CHARS}
                      </span>
                    </div>
                    <Input
                      value={newTransaction.categoria}
                      onChange={(e) => setNewTransaction({ ...newTransaction, categoria: e.target.value })}
                      onPaste={(e) => limitPaste(e, "categoria", MAX_CATEGORIA_CHARS)}
                      maxLength={MAX_CATEGORIA_CHARS}
                      className={formErrors.categoria ? "border-red-500" : ""}
                      placeholder="Ej: Gastos Operativos, Presupuesto Asignado"
                      list="categorias-list"
                    />
                    <datalist id="categorias-list">
                      {categorias.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    {formErrors.categoria && <p className="text-red-500 text-sm mt-1">{formErrors.categoria}</p>}
                  </div>

                  <div>
                    <Label htmlFor="programa">Proyecto</Label>
                    <select
                      className={`w-full border rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.programa ? "border-red-500" : "border-gray-300"}`}
                      value={selectedProject ?? newTransaction.programa}
                      disabled={Boolean(selectedProject)}
                      onChange={(e) => setNewTransaction({ ...newTransaction, programa: e.target.value })}
                    >
                      <option value="">Selecciona un proyecto</option>
                      {proyectos.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {formErrors.programa && <p className="text-red-500 text-sm mt-1">{formErrors.programa}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="moneda">Moneda</Label>
                      <select
                        className={`w-full border rounded-md h-9 px-2 text-sm ${formErrors.moneda ? "border-red-500" : ""}`}
                        value={newTransaction.moneda}
                        onChange={(e) =>
                          setNewTransaction({ ...newTransaction, moneda: e.target.value as "CRC" | "USD" | "EUR" })
                        }
                      >
                        <option value="CRC">₡ Colones</option>
                        <option value="USD">$ Dólares</option>
                        <option value="EUR">€ Euros</option>
                      </select>
                      {formErrors.moneda && <p className="text-sm text-red-600">{formErrors.moneda}</p>}
                    </div>

                    <div>
                      <Label htmlFor="monto">Monto</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={newTransaction.monto || ""}
                        onChange={(e) => setNewTransaction({ ...newTransaction, monto: Number(e.target.value) || 0 })}
                        className={formErrors.monto ? "border-red-500" : ""}
                      />
                      {formErrors.monto && <p className="text-red-500 text-sm mt-1">{formErrors.monto}</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <span className="text-xs text-slate-500">
                        {descripcionCharCount}/{MAX_DESCRIPCION_CHARS}
                      </span>
                    </div>
                    <Textarea
                      value={newTransaction.descripcion || ""}
                      onChange={(e) => setNewTransaction({ ...newTransaction, descripcion: e.target.value })}
                      onPaste={(e) => limitPaste(e, "descripcion", MAX_DESCRIPCION_CHARS)}
                      maxLength={MAX_DESCRIPCION_CHARS}
                      className={formErrors.descripcion ? "border-red-500" : ""}
                      placeholder="Descripción detallada de la transacción"
                      rows={3}
                    />
                    {formErrors.descripcion && <p className="text-red-500 text-sm mt-1">{formErrors.descripcion}</p>}
                  </div>

                  <Button type="button" onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isEditing ? "Actualizar Transacción" : "Crear Transacción"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Tipo</Label>
            <select
              className="w-full border rounded-md h-9 px-2 text-sm"
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
            >
              <option value="all">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>

          <div>
            <Label>Categoría</Label>
            <Input
              placeholder="Filtrar por categoría"
              value={filters.categoria}
              onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
              list="categorias-list"
            />
          </div>

          <div>
            <Label>Fecha Desde</Label>
            <Input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
            />
          </div>

          <div>
            <Label>Fecha Hasta</Label>
            <Input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-2">
          Mostrando {filteredTransactions.length} de {transactions.length} transacciones
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Categoría</th>
                <th className="text-left p-3 font-medium">Proyecto</th>
                <th className="text-left p-3 font-medium">Descripción</th>
                <th className="text-left p-3 font-medium">Monto</th>
                <th className="text-left p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron transacciones con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{formatDate(t.fecha)}</td>
                    <td className="p-3">
                      <Badge
                        variant={t.tipo === "ingreso" ? "default" : "destructive"}
                        className={`capitalize ${t.tipo === "ingreso" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                      >
                        {t.tipo}
                      </Badge>
                    </td>
                    <td className="p-3">{t.categoria}</td>
                    <td className="p-3">{t.programa}</td>
                    <td className="p-3 max-w-xs truncate" title={t.descripcion}>
                      {t.descripcion}
                    </td>
                    <td className={`p-3 font-semibold ${t.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(t.monto, t.moneda)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleEdit(t)}>
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                              Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la transacción:
                                <br />
                                <strong>{t.descripcion}</strong> por {formatCurrency(t.monto, t.moneda)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(t.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export { TransactionsList }