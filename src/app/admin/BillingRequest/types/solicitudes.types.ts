// types/solicitudes.ts

export type Currency = 'CRC' | 'USD';

// Lo que envías al crear una solicitud
export interface solicitud {
  amount: number;        // Monto solicitado
  currency: Currency;    // Moneda (CRC, USD, EUR)
  concept: string;       // Concepto (ej. "Insumos para vivero")
  projectId: string;     // ID del proyecto
  projectName?: string;  // Nombre del proyecto (opcional)
  comentarioContadora?: string;  
  comentarioDirector?: string;  
  attachmentUrl?: string;// URL a archivo PDF/imagen
  requesterId?: string;  // ID del solicitante (opcional)
  requesterName?: string;// Nombre del solicitante (opcional)
  status: string; 
}