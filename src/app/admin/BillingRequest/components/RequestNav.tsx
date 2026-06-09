"use client";

import { ArrowLeft } from "lucide-react";
import { useSolicitanteRole } from "../hooks/useSolicitanteRole";

const ALL_TABS = [
  "Solicitudes",
  "Validación Contable",
  "Aprobación Dirección",
  "Pendientes de pago",
  "Historial",
] as const;

/** Tabs visibles para colaboradorsolicitante */
const SOLICITANTE_TABS = ["Solicitudes", "Historial"] as const;

export type RequestTab = (typeof ALL_TABS)[number];

interface Props {
  active: RequestTab;
  onChange: (tab: RequestTab) => void;
}

export default function RequestNav({ active, onChange }: Props) {
  const { isSolicitante } = useSolicitanteRole();

  const tabs: readonly RequestTab[] = isSolicitante ? SOLICITANTE_TABS : ALL_TABS;

  const subtitle = isSolicitante
    ? "Crea solicitudes y consulta su estado."
    : "Crea, valida y aprueba solicitudes. Administra pagos y consulta el historial.";

  const NavButtons = ({ className }: { className?: string }) => (
    <nav className={className}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap ${
            active === tab
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Título ── */}
        <div className="text-center py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Gestión de Solicitudes
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{subtitle}</p>
        </div>

        {/* ── Desktop ── */}
        <div className="hidden lg:block">
          <div className="relative flex items-center justify-center h-16">
            <a href="/admin" className="absolute left-0">
              <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </a>
            <NavButtons className="flex flex-wrap gap-2 justify-center max-w-3xl" />
          </div>
        </div>

        {/* ── Tablet ── */}
        <div className="hidden md:block lg:hidden pb-4">
          <div className="mb-3">
            <a href="/admin">
              <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </a>
          </div>
          <NavButtons className={`grid gap-2 ${isSolicitante ? "grid-cols-2" : "grid-cols-2"}`} />
        </div>

        {/* ── Mobile ── */}
        <div className="md:hidden pb-4">
          <div className="mb-3">
            <a href="/admin">
              <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </a>
          </div>
          <NavButtons className="flex flex-col gap-2" />
        </div>
      </div>
    </div>
  );
}
