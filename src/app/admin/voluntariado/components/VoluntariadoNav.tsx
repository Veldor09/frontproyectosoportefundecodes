"use client";

import { ArrowLeft } from "lucide-react";

// La pestaña "Programas" se movió al módulo "Proyectos y Programas".
const tabs = ["Voluntarios", "Asignación", "Sanciones"] as const;
type Tab = (typeof tabs)[number];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function VoluntariadoNav({ active, onChange }: Props) {
  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título principal */}
        <div className="text-center py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Voluntariado
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registro y gestión de voluntarios, asignaciones y sanciones.
            La administración de programas se encuentra en{" "}
            <a href="/admin/projects" className="text-blue-600 hover:underline">
              Proyectos y Programas
            </a>.
          </p>
        </div>

        {/* Navegación - Desktop */}
        <div className="hidden md:block">
          <div className="relative flex items-center justify-center h-16">
            <a href="/admin" className="absolute left-0">
              <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </a>

            <nav className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onChange(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                    active === tab
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Navegación - Mobile */}
        <div className="md:hidden pb-4">
          <div className="mb-3">
            <a href="/admin">
              <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </a>
          </div>

          <nav className="flex flex-col sm:flex-row gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onChange(tab)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm flex-1 ${
                  active === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
