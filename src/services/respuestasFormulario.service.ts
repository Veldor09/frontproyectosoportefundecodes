import axios from "axios";

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

const API_URL = `${BASE_URL}/api`;

function authHeader() {
  if (typeof window === "undefined") return {};

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type TipoFormulario =
  | "CONTACTO"
  | "VOLUNTARIADO"
  | "ALIANZA";

export type EstadoRespuestaFormulario =
  | "PENDIENTE"
  | "ACEPTADO"
  | "RECHAZADO";

export interface RespuestaFormulario {
  id: string;
  tipoFormulario: TipoFormulario;
  nombre?: string | null;
  correo?: string | null;
  telefono?: string | null;
  payload: Record<string, any>;
  estado: EstadoRespuestaFormulario;
  createdAt: string;
  updatedAt: string;
}

export interface GetRespuestasParams {
  page?: number;
  limit?: number;
  search?: string;
  tipoFormulario?: string;
  estado?: string;
}

export interface GetRespuestasResponse {
  data: RespuestaFormulario[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PendingRespuestasFormularioCount {
  contacto: number;
  voluntariado: number;
  total: number;
}

function buildQS(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();

  if (!params) return "";

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });

  const str = qs.toString();
  return str ? `?${str}` : "";
}

export async function getRespuestasFormulario(
  params?: GetRespuestasParams
): Promise<GetRespuestasResponse> {
  const qs = buildQS({
    page: params?.page,
    limit: params?.limit,
    search: params?.search,
    tipoFormulario: params?.tipoFormulario,
    estado: params?.estado,
  });

  const { data } = await axios.get(`${API_URL}/respuestas-formulario${qs}`, {
    headers: {
      ...authHeader(),
    },
    withCredentials: true,
  });

  return data;
}

export async function getPendingRespuestasFormularioCount(): Promise<PendingRespuestasFormularioCount> {
  const { data } = await axios.get(
    `${API_URL}/respuestas-formulario/pending-count`,
    {
      headers: {
        ...authHeader(),
      },
      withCredentials: true,
    }
  );

  return data;
}

export async function getRespuestaFormularioById(
  id: string
): Promise<RespuestaFormulario> {
  const { data } = await axios.get(`${API_URL}/respuestas-formulario/${id}`, {
    headers: {
      ...authHeader(),
    },
    withCredentials: true,
  });

  return data;
}

export async function updateEstadoRespuestaFormulario(
  id: string,
  estado: EstadoRespuestaFormulario
): Promise<RespuestaFormulario> {
  const { data } = await axios.patch(
    `${API_URL}/respuestas-formulario/${id}/estado`,
    { estado },
    {
      headers: {
        ...authHeader(),
      },
      withCredentials: true,
    }
  );

  return data;
}

export async function crearRespuestaFormulario(payload: {
  tipoFormulario: TipoFormulario;
  nombre?: string;
  correo?: string;
  telefono?: string;
  payload: Record<string, any>;
}) {
  const { data } = await axios.post(
    `${API_URL}/respuestas-formulario`,
    payload,
    {
      withCredentials: true,
    }
  );

  return data;
}