// Types for the accounting module
export interface BudgetItem {
  id: string
  programa: string
  mes: string
  año: number
  montoAsignado: number
  montoEjecutado: number
  fechaCreacion: Date
  fechaActualizacion: Date
}

export interface Transaction {
  id: string
  fecha: Date
  tipo: "ingreso" | "egreso"
  categoria: string
  descripcion: string
  monto: number
  moneda: string
  programa?: string
  fechaCreacion: Date
}

export interface Document {
  id: string
  nombre: string
  programa: string
  mes: string
  año: number
  tipo: string
  tamaño: number
  url: string
  fechaSubida: Date
}

export interface FilterState {
  programa: string
  mes: string
  año: string
  categoria: string
  tipo: string
  fechaInicio: string
  fechaFin: string
}
