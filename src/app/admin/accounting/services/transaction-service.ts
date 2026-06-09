// src/app/admin/contabilidad/services/TransactionService.ts
"use client";

import axios from "axios";
import type { Transaction } from "../types";

/* ========================= 🌐 Config base ========================= */
export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/* ========================= 🔐 Headers ========================= */
function authHeader() {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ========================= 🔎 Helpers ========================= */
async function findProjectIdByTitle(title: string): Promise<number> {
  if (!title) throw new Error("Título de proyecto requerido");

  const { data: projects } = await axios.get(
    `${API_URL}/api/projects`,
    { headers: authHeader(), withCredentials: true }
  );

  const match = (projects as Array<{ id: number; title: string }>).find(
    (p) => (p.title ?? "").toLowerCase() === title.toLowerCase()
  );
  if (!match) throw new Error("Proyecto no encontrado: " + title);
  return match.id;
}

function mapFromApi(x: any): Transaction {
  return {
    id: x.id,
    fecha: new Date(x.fecha),
    tipo: x.tipo,
    categoria: x.categoria,
    descripcion: x.descripcion,
    monto: Number(x.monto),
    moneda: x.moneda || "CRC",
    programa: x.proyecto,
    fechaCreacion: x.createdAt ? new Date(x.createdAt) : new Date(),
  };
}

/* ========================= 💰 Servicio Axios ========================= */
export class TransactionService {
  /** Obtener lista de transacciones con filtros opcionales */
  static async getTransactions(filters?: {
    tipo?: "ingreso" | "egreso";
    categoria?: string;
    fechaInicio?: string;
    fechaFin?: string;
    programa?: string;
  }): Promise<Transaction[]> {
    const params: Record<string, any> = {};

    if (filters?.tipo) params.tipo = filters.tipo;
    if (filters?.categoria) params.categoria = filters.categoria;
    if (filters?.fechaInicio) params.fechaInicio = filters.fechaInicio;
    if (filters?.fechaFin) params.fechaFin = filters.fechaFin;

    if (filters?.programa) {
      try {
        const pid = await findProjectIdByTitle(filters.programa);
        params.projectId = pid;
      } catch {
        /* ignora si no existe */
      }
    }

    const { data } = await axios.get(`${API_URL}/api/contabilidad/transacciones`, {
      headers: authHeader(),
      withCredentials: true,
      params,
    });

    return (data as any[]).map(mapFromApi);
  }

  /** Crear una transacción */
  static async createTransaction(
    t: Omit<Transaction, "id" | "fechaCreacion">
  ): Promise<Transaction> {
    const projectId = await findProjectIdByTitle(t.programa ?? "");
    const body = {
      tipo: t.tipo,
      categoria: t.categoria,
      descripcion: t.descripcion,
      monto: t.monto,
      moneda: t.moneda || "CRC",
      fecha: (t.fecha instanceof Date
        ? t.fecha
        : new Date(t.fecha as any)
      ).toISOString().slice(0, 10),
      projectId,
      proyecto: t.programa,
    };

    const { data } = await axios.post(
      `${API_URL}/api/contabilidad/transacciones`,
      body,
      { headers: { "Content-Type": "application/json", ...authHeader() }, withCredentials: true }
    );

    return mapFromApi(data);
  }

  /** Actualizar transacción existente */
  static async updateTransaction(
    id: string,
    t: Partial<Transaction>
  ): Promise<Transaction> {
    const body: any = {};
    if (t.tipo) body.tipo = t.tipo;
    if (t.categoria) body.categoria = t.categoria;
    if (t.descripcion) body.descripcion = t.descripcion;
    if (t.monto != null) body.monto = t.monto;
    if (t.moneda) body.moneda = t.moneda;
    if (t.fecha)
      body.fecha = (t.fecha instanceof Date
        ? t.fecha
        : new Date(t.fecha as any)
      ).toISOString().slice(0, 10);
    if (t.programa) body.proyecto = t.programa;

    const { data } = await axios.patch(
      `${API_URL}/api/contabilidad/transacciones/${id}`,
      body,
      { headers: { "Content-Type": "application/json", ...authHeader() }, withCredentials: true }
    );

    return mapFromApi(data);
  }

  /** Eliminar una transacción */
  static async deleteTransaction(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/contabilidad/transacciones/${id}`, {
      headers: authHeader(),
      withCredentials: true,
    });
  }
}
