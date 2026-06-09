export interface Voluntario {
  id: number;
  nombre: string;
  nacionalidad?: string | null;
  fechaEntrada: string;   // ISO string
  fechaSalida?: string | null;
  ong?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type VoluntarioCreateDTO = {
  nombre: string;
  nacionalidad?: string | null;
  fechaEntrada: string;
  fechaSalida?: string | null;
  ong?: string | null;
  email?: string | null;
};

export type VoluntarioUpdateDTO = Partial<VoluntarioCreateDTO>;
