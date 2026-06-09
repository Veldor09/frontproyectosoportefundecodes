"use client";

import axios from "axios";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

function authHeader() {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export interface Cuenta {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  monedaBase: "CRC" | "USD" | "EUR";
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  areaId?: number | null;
  area?: { id: number; nombre: string } | null;
  _count?: { proyectos: number; programas: number };
}

export interface CuentaResumen {
  cuenta: Cuenta;
  totales: {
    presupuestoAsignado: number;
    ingresos: number;
    egresos: number;
    ejecutado: number;
    presupuestoEfectivo: number;
    disponible: number;
    porcentajeUtilizado: number;
  };
  contadores: { proyectos: number; programas: number };
}

export interface CuentaDetalle extends Cuenta {
  proyectos: Array<{
    id: number;
    title: string;
    status: string;
    presupuestoTotal: string;
    monedaPresupuesto: string;
  }>;
  programas: Array<{
    id: number;
    nombre: string;
    presupuestoTotal: string;
    monedaPresupuesto: string;
  }>;
}

export interface SaldoDestino {
  id: number;
  nombre: string;
  moneda: string;
  presupuestoTotal: number;
  ingresos: number;
  egresos: number;
  ejecutado: number;
  disponible: number;
  porcentajeUtilizado: number;
}

export interface Transaccion {
  id: string;
  projectId?: number | null;
  programaId?: number | null;
  cuentaId?: number | null;
  proyecto: string;
  fecha: string;
  tipo: "ingreso" | "egreso";
  categoria: string;
  descripcion: string;
  monto: string;
  moneda: "CRC" | "USD" | "EUR";
  anuladaAt?: string | null;
  paymentId?: string | null;
  createdAt: string;
  project?: { id: number; title: string } | null;
  programa?: { id: number; nombre: string } | null;
}

export const CuentasService = {
  async list(params?: {
    q?: string;
    activa?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { data } = await axios.get(`${API_URL}/api/cuentas`, {
      headers: authHeader(),
      params,
    });
    return data as { items: Cuenta[]; total: number; page: number; pageSize: number; totalPages: number };
  },

  async getOne(id: number) {
    const { data } = await axios.get(`${API_URL}/api/cuentas/${id}`, {
      headers: authHeader(),
    });
    return data as CuentaDetalle;
  },

  async getResumen(id: number) {
    const { data } = await axios.get(`${API_URL}/api/cuentas/${id}/resumen`, {
      headers: authHeader(),
    });
    return data as CuentaResumen;
  },

  async create(dto: { nombre: string; codigo: string; descripcion?: string; monedaBase?: string; areaId?: number | null }) {
    const { data } = await axios.post(`${API_URL}/api/cuentas`, dto, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    return data as Cuenta;
  },

  async update(id: number, dto: Partial<{ nombre: string; codigo: string; descripcion: string; monedaBase: string; activa: boolean; areaId: number | null }>) {
    const { data } = await axios.patch(`${API_URL}/api/cuentas/${id}`, dto, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    return data as Cuenta;
  },

  async archive(id: number) {
    const { data } = await axios.delete(`${API_URL}/api/cuentas/${id}`, {
      headers: authHeader(),
    });
    return data;
  },

  async restore(id: number) {
    const { data } = await axios.post(`${API_URL}/api/cuentas/${id}/restaurar`, {}, {
      headers: authHeader(),
    });
    return data;
  },

  async asignarProyecto(cuentaId: number, projectId: number) {
    const { data } = await axios.post(
      `${API_URL}/api/cuentas/${cuentaId}/proyectos/${projectId}`,
      {},
      { headers: authHeader() },
    );
    return data;
  },

  async desasignarProyecto(cuentaId: number, projectId: number) {
    const { data } = await axios.delete(
      `${API_URL}/api/cuentas/${cuentaId}/proyectos/${projectId}`,
      { headers: authHeader() },
    );
    return data;
  },

  async asignarPrograma(cuentaId: number, programaId: number) {
    const { data } = await axios.post(
      `${API_URL}/api/cuentas/${cuentaId}/programas/${programaId}`,
      {},
      { headers: authHeader() },
    );
    return data;
  },

  async desasignarPrograma(cuentaId: number, programaId: number) {
    const { data } = await axios.delete(
      `${API_URL}/api/cuentas/${cuentaId}/programas/${programaId}`,
      { headers: authHeader() },
    );
    return data;
  },

  async updateProjectPresupuesto(projectId: number, presupuestoTotal: number, monedaPresupuesto = "CRC") {
    const { data } = await axios.patch(
      `${API_URL}/api/projects/${projectId}`,
      { presupuestoTotal, monedaPresupuesto },
      { headers: { "Content-Type": "application/json", ...authHeader() } },
    );
    return data;
  },

  async updateProgramaPresupuesto(programaId: number, presupuestoTotal: number, monedaPresupuesto = "CRC") {
    const { data } = await axios.patch(
      `${API_URL}/api/programa-voluntariado/${programaId}`,
      { presupuestoTotal, monedaPresupuesto },
      { headers: { "Content-Type": "application/json", ...authHeader() } },
    );
    return data;
  },
};

export const TransaccionesApiService = {
  async list(params: {
    projectId?: number;
    programaId?: number;
    cuentaId?: number;
    tipo?: "ingreso" | "egreso";
    incluirAnuladas?: boolean;
    fechaInicio?: string;
    fechaFin?: string;
  }) {
    const { data } = await axios.get(
      `${API_URL}/api/contabilidad/transacciones`,
      { headers: authHeader(), params },
    );
    return data as Transaccion[];
  },

  async create(dto: {
    tipo: "ingreso" | "egreso";
    moneda: "CRC" | "USD" | "EUR";
    categoria: string;
    descripcion: string;
    monto: number;
    fecha: string;
    projectId?: number;
    programaId?: number;
    proyecto: string;
  }) {
    const { data } = await axios.post(
      `${API_URL}/api/contabilidad/transacciones`,
      dto,
      { headers: { "Content-Type": "application/json", ...authHeader() } },
    );
    return data as Transaccion;
  },

  async anular(id: string, motivo: string) {
    const { data } = await axios.post(
      `${API_URL}/api/contabilidad/transacciones/${id}/anular`,
      { motivo },
      { headers: { "Content-Type": "application/json", ...authHeader() } },
    );
    return data;
  },

  async saldoProyecto(id: number) {
    const { data } = await axios.get(
      `${API_URL}/api/contabilidad/transacciones/saldo/proyecto/${id}`,
      { headers: authHeader() },
    );
    return data as SaldoDestino;
  },

  async saldoPrograma(id: number) {
    const { data } = await axios.get(
      `${API_URL}/api/contabilidad/transacciones/saldo/programa/${id}`,
      { headers: authHeader() },
    );
    return data as SaldoDestino;
  },
};
