export type OrigenVoluntariado = "CUENTA_PROPIA" | "INTERMEDIARIO";

export type ProgramaVoluntariadoAsignacionInfo = {
  pagoRealizado: boolean;
  origen: OrigenVoluntariado;
  intermediario: string | null;
  fechaEntrada: string | null;
  fechaSalida: string | null;
  horasTotales: number;
  assignedAt: string | null;
};

export type ProgramaVoluntariado = {
  id: number | string;
  nombre: string;
  lugar: string;
  descripcion: string;
  limiteParticipantes: number;

  // ids de voluntarios asignados al programa
  voluntariosAsignados: (number | string)[];

  // metadata por voluntarioId
  asignacionesPorVoluntario: Record<string, ProgramaVoluntariadoAsignacionInfo>;
};