"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { usePendingRespuestasFormularioCount } from "../hooks/usePendingRespuestasFormularioCount";

interface Props {
  href: string;
}

export default function RespuestasFormulariosCard({ href }: Props) {
  const { data, error, isError, isLoading } = usePendingRespuestasFormularioCount();

  console.log("contador respuestas formularios:", data);
  if (isError) {
    console.error("error contador respuestas formularios:", error);
  }

  const totalPendientes = data?.total ?? 0;

  return (
    <Link
      href={href}
      className="relative block rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
    >
      {totalPendientes > 0 && (
        <span className="absolute left-8 top-6 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-sm font-bold text-white shadow-sm">
          {totalPendientes}
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <FileText className="h-8 w-8 text-slate-800" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-semibold leading-tight text-slate-900 sm:text-[20px]">
            Respuestas de Formularios
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">
            Visualiza y gestiona las respuestas de los formularios públicos
          </p>

          {isLoading && (
            <p className="mt-1 text-xs text-slate-400">
              Cargando contador...
            </p>
          )}

          {isError && (
            <p className="mt-1 text-xs text-red-500">
              Error al cargar contador
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 text-[15px] font-medium text-indigo-600">
        Ir →
      </div>
    </Link>
  );
}