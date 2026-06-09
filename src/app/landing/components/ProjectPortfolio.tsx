"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "../../../components/ui/Modal";
import { listProjects } from "@/services/projects.service";
import type { Project } from "@/lib/projects.types";
import { MapPin, Tag, ArrowRight, Layers } from "lucide-react";

const getStatusColor = (s: string) => {
  switch (s) {
    case "EN_PROCESO": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "FINALIZADO": return "bg-blue-100 text-blue-700 border-blue-200";
    case "PAUSADO": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const getStatusLabel = (s: string) => {
  switch (s) {
    case "EN_PROCESO": return "En proceso";
    case "FINALIZADO": return "Finalizado";
    case "PAUSADO": return "Pausado";
    default: return s;
  }
};

export default function PortafolioProyectos() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await listProjects({ page: 1, pageSize: 12 });
        const published = (Array.isArray(data) ? data : []).filter((p) => p?.published === true);
        setItems(published.slice(0, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando proyectos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mx-4 sm:mx-6">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600" />

      {/* Subtle background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-50 rounded-full opacity-50 blur-3xl pointer-events-none" />

      <div className="relative p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-10">
         <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
  <span className="text-blue-600">Portafolio</span> de{" "}
  <span className="text-blue-600">Proyectos</span>
</h2>
        </div>

        {/* Content */}
        {error ? (
          <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-center">
            <p className="text-red-700 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => location.reload()} className="border-red-300 text-red-700 hover:bg-red-100">
              Reintentar
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-400">Cargando proyectos…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Layers className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-gray-500 font-medium">Aún no hay proyectos publicados.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((p, i) => (
              <div
                key={p.id}
                className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                  {p.coverUrl ? (
                    <img
                      src={p.coverUrl}
                      alt={p.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="h-full w-full items-center justify-center"
                    style={{ display: p.coverUrl ? "none" : "flex" }}
                  >
                    <Layers className="w-10 h-10 text-slate-300" />
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {p.status && (
                    <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${getStatusColor(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1.5 break-words hyphens-auto group-hover:text-blue-700 transition-colors">
                    {p.title}
                  </h3>

                  {p.summary && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                      {p.summary}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.place && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                        <MapPin className="w-3 h-3" />{p.place}
                      </span>
                    )}
                    {p.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md">
                        <Tag className="w-3 h-3" />{p.category}
                      </span>
                    )}
                    {p.area && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                        {p.area}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => { setSelected(p); setOpen(true); }}
                    className="w-full py-2 px-4 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-300"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center mt-10">
          <Link
            href="/landing/projects"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          >
            Explorar todos los proyectos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={selected?.title ?? ""}>
        {selected?.coverUrl && (
          <img src={selected.coverUrl} alt={selected.title} className="w-full h-56 object-cover rounded-xl mb-5" />
        )}
        {selected?.summary && <p className="text-slate-600 mb-4 leading-relaxed">{selected.summary}</p>}
        <div className="flex flex-wrap gap-2 mb-4">
          {selected?.place && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
              <MapPin className="w-3.5 h-3.5" />{selected.place}
            </span>
          )}
          {selected?.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
              <Tag className="w-3.5 h-3.5" />{selected.category}
            </span>
          )}
          {selected?.area && (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg">{selected.area}</span>
          )}
          {selected?.status && (
            <span className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${getStatusColor(selected.status)}`}>
              {getStatusLabel(selected.status)}
            </span>
          )}
        </div>
        {selected?.content && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selected.content}</p>
          </div>
        )}
      </Modal>
    </section>
  );
}