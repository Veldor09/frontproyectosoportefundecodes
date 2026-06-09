"use client";

import { ArrowLeft, UserCog } from "lucide-react";

export type CollabTab = "colaboradores" | "externos";

const TABS: { key: CollabTab; label: string }[] = [
  { key: "colaboradores", label: "Colaboradores" },
  { key: "externos",      label: "Colaboradores Externos" },
];

interface Props {
  active: CollabTab;
  onChange: (tab: CollabTab) => void;
}

export default function ColaboradoresNav({ active, onChange }: Props) {
  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Título centrado */}
        <div className="text-center py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Colaboradores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona colaboradores internos y colaboradores externos de área.
          </p>
        </div>

        {/* Desktop — back izq · tabs center · usuarios der */}
        <div className="hidden md:block">
          <div className="relative flex items-center justify-center h-16">
            <a href="/admin" className="absolute left-0">
              <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </a>

            <nav className="flex gap-2">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onChange(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                    active === key
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <a href="/admin/users" className="absolute right-0">
              <button className="bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Gestión de Usuarios
              </button>
            </a>
          </div>
        </div>

        {/* Mobile */}
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
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onChange(key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm flex-1 ${
                  active === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
            <a href="/admin/users" className="flex-1">
              <button className="w-full bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                <UserCog className="w-4 h-4" />
                Gestión de Usuarios
              </button>
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
