// src/app/admin/contabilidad/services/DocumentService.ts
"use client";

import axios from "axios";
import type { Document } from "../types";

/* ========================= 🌐 Config base ========================= */
export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/* ========================= 🔐 Headers ========================= */
function authHeader() {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ========================= 📅 Utilidades ========================= */
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const monthNameToNumber = (name: string) => MONTHS.indexOf(name) + 1;

/* ========================= 🔍 Helpers ========================= */
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

function mimeToTipo(mime: string): string {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("sheet")) return "Excel";
  if (mime.includes("image")) return "Imagen";
  return "Archivo";
}

function mapFromApi(x: any): Document {
  return {
    id: x.id,
    nombre: x.nombre,
    programa: x.proyecto, // en la UI sigue llamándose “programa”
    mes: MONTHS[Number(x.mes) - 1] ?? "",
    año: Number(x.anio),
    tipo: mimeToTipo(x.tipoMime),
    tamaño: Number(x.bytes),
    url: x.url?.startsWith("http") ? x.url : `${API_URL}${x.url}`,
    fechaSubida: x.createdAt ? new Date(x.createdAt) : new Date(),
  };
}

/* ========================= 📂 Servicio principal ========================= */
export class DocumentService {
  /** Listar documentos filtrados */
  static async getDocuments(filters?: {
    programa?: string;
    mes?: string;
    anio?: number;
  }): Promise<Document[]> {
    const params: Record<string, any> = {};

    if (filters?.programa) {
      try {
        const pid = await findProjectIdByTitle(filters.programa);
        params.projectId = pid;
      } catch {
        /* ignora si no existe */
      }
    }
    if (filters?.mes) params.mes = monthNameToNumber(filters.mes);
    if (filters?.anio) params.anio = filters.anio;

    const { data } = await axios.get(`${API_URL}/api/contabilidad/documentos`, {
      headers: authHeader(),
      withCredentials: true,
      params,
    });

    return (data as any[]).map(mapFromApi);
  }

  /** Subir un documento asociado a un proyecto */
  static async uploadDocument(
    file: File,
    metadata: Omit<Document, "id" | "url" | "fechaSubida" | "tamaño" | "tipo">
  ): Promise<Document> {
    const projectId = await findProjectIdByTitle(metadata.programa);
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", String(projectId));
    form.append("proyecto", metadata.programa);
    form.append("mes", String(monthNameToNumber(metadata.mes)));
    form.append("anio", String(metadata.año));

    const { data } = await axios.post(
      `${API_URL}/api/contabilidad/documentos/upload`,
      form,
      {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );

    return mapFromApi(data);
  }

  /** Eliminar documento por ID */
  static async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/contabilidad/documentos/${id}`, {
      headers: authHeader(),
      withCredentials: true,
    });
  }
}
