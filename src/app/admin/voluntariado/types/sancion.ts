// src/types/sancion.ts

export type SancionTipo = "LEVE" | "GRAVE" | "MUY_GRAVE" | "EXTREMADAMENTE_GRAVE";
export type SancionEstado = "ACTIVA" | "EXPIRADA" | "REVOCADA";

export interface Sancion {
  id: number;
  voluntarioId: number;
  tipo: SancionTipo;
  motivo: string;
  descripcion?: string;
  fechaInicio: string; // ISO
  fechaVencimiento?: string | null; // ISO | null (permanente)
  estado: SancionEstado;
  creadaPor?: string;
  revocadaPor?: string | null;
  fechaRevocacion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  voluntario?: {
    id: number;
    nombre: string;
    email?: string | null;
    nacionalidad?: string | null;
  };
}

export interface SancionCreateDTO {
  voluntarioId: number;
  tipo: SancionTipo;
  motivo: string;
  descripcion?: string;
  fechaInicio: string; // ISO
  fechaVencimiento?: string | null; // ISO | null
  creadaPor?: string;
}

export interface SancionUpdateDTO {
  // Solo los campos que el backend permitirá actualizar
  tipo?: SancionTipo;
  motivo?: string;
  descripcion?: string | null;
  fechaInicio?: string;           // ISO
  fechaVencimiento?: string | null;
  creadaPor?: string | null;
}
