export interface Visitacion {
  id: number;
  fecha: string;
  totalPersonas: number;
  nacionales: number;
  extranjeros: number;
  notas?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitacionCreateInput {
  fecha: string;
  totalPersonas: number;
  nacionales: number;
  notas?: string;
}

export type VisitacionUpdateInput = Partial<VisitacionCreateInput>;

export interface VisitacionListResponse {
  data: Visitacion[];
  total: number;
}
