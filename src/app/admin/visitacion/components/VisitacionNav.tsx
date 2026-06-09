"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  onNew: () => void;
  /** Acción extra que se coloca a la derecha en el nav (ej. ExportButton) */
  rightAction?: ReactNode;
}

export default function VisitacionNav({ onNew, rightAction }: Props) {
  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Título centrado */}
        <div className="text-center py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Visitación
          </h1>
          <p className="text-sm text-slate-500">
            Registro de visitas: nacionales, extranjeros y totales
          </p>
        </div>

        {/* Desktop: volver (izq) · Export + Nueva visita (der) */}
        <div className="hidden md:block">
          <div className="relative flex items-center justify-center h-14 pb-3">
            <Link href="/admin" className="absolute left-0">
              <button
                type="button"
                className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </Link>

            <div className="absolute right-0 flex items-center gap-2">
              {rightAction}
              <button
                type="button"
                onClick={onNew}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                + Nueva visita
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: columna */}
        <div className="flex flex-col gap-2 pb-4 md:hidden">
          <Link href="/admin">
            <button
              type="button"
              className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </button>
          </Link>
          {rightAction && <div className="w-full">{rightAction}</div>}
          <button
            type="button"
            onClick={onNew}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            + Nueva visita
          </button>
        </div>
      </div>
    </div>
  );
}
