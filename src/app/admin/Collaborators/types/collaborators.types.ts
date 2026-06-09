export type CollaboratorEstado = "ACTIVO" | "INACTIVO";
/** Valores reales devueltos por la API */
export type CollaboratorRol =
  | "admin"
  | "colaboradorfactura"
  | "colaboradorvoluntariado"
  | "colaboradorproyecto"
  | "colaboradorcontabilidad"
  | "colaboradorvisitacion"
  | string; // fallback para roles futuros

export type Collaborator = {
  id: number | string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  /** Todos los roles asignados al colaborador (multi-rol) */
  roles?: string[];
  status?: CollaboratorEstado;
  identification: string;
  birthdate?: string;
  createdAt?: string;
};

export type ListCollaboratorsParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  rol?: string;
  estado?: CollaboratorEstado;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export interface CreateCollaboratorDto {
  fullName: string;
  email: string;
  identification: string;
  birthdate: string;       // YYYY-MM-DD
  phone: string;           // E.164
  role: string;
  roles?: string[];
  password?: string;
}
