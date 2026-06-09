"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Edit2, Plus, Trash2 } from "lucide-react"
import { BudgetService } from "../services/budget-service"
import type { BudgetItem } from "../types"
import { ProjectsService } from "../services/projects-service"

const TODOS_PROY = "Todos los proyectos"
const TODOS_MES = "Todos los meses"
const TODOS_ANIO = "Todos los años"
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

interface BudgetTableProps {
  selectedProject?: string
  onDataChange?: () => void
}

export function BudgetTable({ selectedProject, onDataChange }: BudgetTableProps) {
  const [filters, setFilters] = useState({ proyecto: TODOS_PROY, mes: TODOS_MES, año: TODOS_ANIO })
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [editForm, setEditForm] = useState({
    proyecto: "",
    mes: "",
    año: "",
    montoAsignado: "",
    montoEjecutado: "",
  })

  const [newBudgetForm, setNewBudgetForm] = useState({
    proyecto: "",
    mes: "",
    año: "",
    montoAsignado: "",
    montoEjecutado: "",
  })

  const todosAños = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: (currentYear + 3) - 2020 + 1 }, (_, i) => String(2020 + i))
  }, [])

  async function load() {
    const items = await BudgetService.getBudgetItems()
    setBudgetData(items)
  }

  useEffect(() => {
    load()
    ProjectsService.list()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setFilters((prev) => ({ ...prev, proyecto: selectedProject }))
    setNewBudgetForm((prev) => ({ ...prev, proyecto: selectedProject }))
  }, [selectedProject])

  const projectTitles = useMemo(() => projects.map(p => p.title), [projects])

  const uniqueProyectos = useMemo(() => {
    return projectTitles.length > 0
      ? projectTitles
      : Array.from(new Set(budgetData.map(i => i.programa)))
  }, [projectTitles, budgetData])

  const filteredBudgetData = budgetData.filter((item) => {
    const proyectoActivo = selectedProject ?? filters.proyecto
    const proyectoMatch = proyectoActivo === TODOS_PROY || item.programa === proyectoActivo
    const mesMatch = filters.mes === TODOS_MES || item.mes === filters.mes
    const añoMatch = filters.año === TODOS_ANIO || String(item.año) === filters.año
    return proyectoMatch && mesMatch && añoMatch
  })

  const handleEditClick = (item: BudgetItem) => {
    setEditingItem(item)
    setEditForm({
      proyecto: item.programa,
      mes: item.mes,
      año: String(item.año),
      montoAsignado: String(item.montoAsignado),
      montoEjecutado: String(item.montoEjecutado),
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await BudgetService.deleteBudgetItem(id)
    await load()
    onDataChange?.()
  }

  const validateEditForm = () => {
    const errors: Record<string, string> = {}
    if (!editForm.proyecto.trim()) errors.proyecto = "El proyecto es requerido"
    if (!editForm.mes) errors.mes = "El mes es requerido"
    if (!editForm.año) errors.año = "El año es requerido"
    if (!editForm.montoAsignado || Number(editForm.montoAsignado) < 0) errors.montoAsignado = "El monto asignado debe ser mayor o igual a 0"
    if (!editForm.montoEjecutado || Number(editForm.montoEjecutado) < 0) errors.montoEjecutado = "El monto ejecutado debe ser mayor o igual a 0"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitEdit = async () => {
    if (!validateEditForm() || !editingItem) return
    await BudgetService.updateBudgetItem(editingItem.id, {
      programa: editForm.proyecto.trim(),
      mes: editForm.mes,
      año: Number(editForm.año),
      montoAsignado: Number(editForm.montoAsignado),
      montoEjecutado: Number(editForm.montoEjecutado),
    })
    await load()
    onDataChange?.()
    setIsEditModalOpen(false)
    setEditingItem(null)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!newBudgetForm.proyecto.trim()) errors.proyecto = "El proyecto es requerido"
    if (!newBudgetForm.mes) errors.mes = "El mes es requerido"
    if (!newBudgetForm.año) errors.año = "El año es requerido"
    if (!newBudgetForm.montoAsignado || Number(newBudgetForm.montoAsignado) < 0) errors.montoAsignado = "El monto asignado debe ser mayor o igual a 0"
    if (!newBudgetForm.montoEjecutado || Number(newBudgetForm.montoEjecutado) < 0) errors.montoEjecutado = "El monto ejecutado debe ser mayor o igual a 0"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitNewBudget = async () => {
    if (!validateForm()) return
    const payload: Omit<BudgetItem, "id" | "fechaCreacion" | "fechaActualizacion"> = {
      programa: newBudgetForm.proyecto.trim(),
      mes: newBudgetForm.mes,
      año: Number(newBudgetForm.año),
      montoAsignado: Number(newBudgetForm.montoAsignado),
      montoEjecutado: Number(newBudgetForm.montoEjecutado),
    }
    await BudgetService.createBudgetItem(payload)
    await load()
    onDataChange?.()
    setNewBudgetForm({ proyecto: "", mes: "", año: "", montoAsignado: "", montoEjecutado: "" })
    setFormErrors({})
    setIsModalOpen(false)
  }

  const handleCloseModal = () => {
    setNewBudgetForm({ proyecto: "", mes: "", año: "", montoAsignado: "", montoEjecutado: "" })
    setFormErrors({})
    setIsModalOpen(false)
  }

  const handleCloseEditModal = () => {
    setEditForm({ proyecto: "", mes: "", año: "", montoAsignado: "", montoEjecutado: "" })
    setFormErrors({})
    setIsEditModalOpen(false)
    setEditingItem(null)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(amount)

  const getExecutionPercentage = (assigned: number, executed: number) =>
    assigned > 0 ? Math.round((executed / assigned) * 100) : 0

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900">Gestión de Presupuesto por Proyectos</CardTitle>

        {/* CAMBIO 1: Contenedor responsive para filtros y botón */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pt-4">
          {/* CAMBIO 2: Filtros responsive */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="space-y-1 flex-1 sm:flex-none">
              <label className="text-sm font-medium text-gray-700">Proyecto</label>
              <select
                className="w-full sm:w-56 border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedProject ?? filters.proyecto}
                disabled={Boolean(selectedProject)}
                onChange={(e) => setFilters({ ...filters, proyecto: e.target.value })}
              >
                <option value={TODOS_PROY}>{TODOS_PROY}</option>
                {uniqueProyectos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1 flex-1 sm:flex-none">
              <label className="text-sm font-medium text-gray-700">Mes</label>
              <select
                className="w-full sm:w-40 border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.mes}
                onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
              >
                <option value={TODOS_MES}>{TODOS_MES}</option>
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="space-y-1 flex-1 sm:flex-none">
              <label className="text-sm font-medium text-gray-700">Año</label>
              <select
                className="w-full sm:w-32 border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.año}
                onChange={(e) => setFilters({ ...filters, año: e.target.value })}
              >
                <option value={TODOS_ANIO}>{TODOS_ANIO}</option>
                {todosAños.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* CAMBIO 3: Botón Agregar con ancho responsive */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Agregar Nuevo Presupuesto</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proyecto *</label>
                  <select
                    className="w-full border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProject ?? newBudgetForm.proyecto}
                    disabled={Boolean(selectedProject)}
                    onChange={(e)=>setNewBudgetForm({...newBudgetForm, proyecto: e.target.value})}
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projectTitles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.proyecto && <p className="text-sm text-red-600">{formErrors.proyecto}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mes *</label>
                  <select className="w-full border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newBudgetForm.mes}
                          onChange={(e)=>setNewBudgetForm({...newBudgetForm, mes: e.target.value})}>
                    <option value="">Seleccionar mes</option>
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {formErrors.mes && <p className="text-sm text-red-600">{formErrors.mes}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Año *</label>
                  <select className="w-full border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newBudgetForm.año}
                          onChange={(e)=>setNewBudgetForm({...newBudgetForm, año: e.target.value})}>
                    <option value="">Seleccionar año</option>
                    {todosAños.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {formErrors.año && <p className="text-sm text-red-600">{formErrors.año}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Asignado (CRC) *</label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00"
                         value={newBudgetForm.montoAsignado}
                         onChange={(e)=>setNewBudgetForm({...newBudgetForm, montoAsignado: e.target.value})}/>
                  {formErrors.montoAsignado && <p className="text-sm text-red-600">{formErrors.montoAsignado}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Ejecutado (CRC) *</label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00"
                         value={newBudgetForm.montoEjecutado}
                         onChange={(e)=>setNewBudgetForm({...newBudgetForm, montoEjecutado: e.target.value})}/>
                  {formErrors.montoEjecutado && <p className="text-sm text-red-600">{formErrors.montoEjecutado}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button onClick={handleSubmitNewBudget} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de EDITAR */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Editar Presupuesto</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proyecto *</label>
                  <select
                    className="w-full border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.proyecto}
                    onChange={(e)=>setEditForm({...editForm, proyecto: e.target.value})}
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projectTitles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.proyecto && <p className="text-sm text-red-600">{formErrors.proyecto}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mes *</label>
                  <select className="w-full border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm.mes}
                          onChange={(e)=>setEditForm({...editForm, mes: e.target.value})}>
                    <option value="">Seleccionar mes</option>
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {formErrors.mes && <p className="text-sm text-red-600">{formErrors.mes}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Año *</label>
                  <select className="w-full border border-gray-300 rounded-md h-9 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm.año}
                          onChange={(e)=>setEditForm({...editForm, año: e.target.value})}>
                    <option value="">Seleccionar año</option>
                    {todosAños.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {formErrors.año && <p className="text-sm text-red-600">{formErrors.año}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Asignado (CRC) *</label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00"
                         value={editForm.montoAsignado}
                         onChange={(e)=>setEditForm({...editForm, montoAsignado: e.target.value})}/>
                  {formErrors.montoAsignado && <p className="text-sm text-red-600">{formErrors.montoAsignado}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Ejecutado (CRC) *</label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00"
                         value={editForm.montoEjecutado}
                         onChange={(e)=>setEditForm({...editForm, montoEjecutado: e.target.value})}/>
                  {formErrors.montoEjecutado && <p className="text-sm text-red-600">{formErrors.montoEjecutado}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseEditModal}>Cancelar</Button>
                <Button onClick={handleSubmitEdit} className="bg-blue-600 hover:bg-blue-700">Actualizar</Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>

        <div className="text-sm text-muted-foreground">
          Mostrando {filteredBudgetData.length} de {budgetData.length} registros
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredBudgetData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No se encontraron registros con los filtros seleccionados.</div>
        ) : (
          <>
            {/* CAMBIO 4: Tabla solo visible en desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Proyecto</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mes</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Año</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Monto Asignado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Monto Ejecutado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">% Ejecución</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgetData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{item.programa}</td>
                      <td className="py-3 px-4">{item.mes}</td>
                      <td className="py-3 px-4">{item.año}</td>
                      <td className="py-3 px-4">{formatCurrency(item.montoAsignado)}</td>
                      <td className="py-3 px-4">{formatCurrency(item.montoEjecutado)}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                          {getExecutionPercentage(item.montoAsignado, item.montoEjecutado)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleEditClick(item)}>
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
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el registro del presupuesto para el proyecto &quot;{item.programa}&quot;.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CAMBIO 5: Vista de cards para móvil */}
            <div className="md:hidden space-y-4">
              {filteredBudgetData.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Proyecto</div>
                      <div className="font-semibold text-gray-900">{item.programa}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Mes</div>
                        <div className="text-sm">{item.mes}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Año</div>
                        <div className="text-sm">{item.año}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Monto Asignado</div>
                      <div className="text-sm font-medium">{formatCurrency(item.montoAsignado)}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Monto Ejecutado</div>
                      <div className="text-sm font-medium">{formatCurrency(item.montoEjecutado)}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">% Ejecución</div>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                        {getExecutionPercentage(item.montoAsignado, item.montoEjecutado)}%
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1" 
                        onClick={() => handleEditClick(item)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white flex-1">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el registro del presupuesto para el proyecto &quot;{item.programa}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
