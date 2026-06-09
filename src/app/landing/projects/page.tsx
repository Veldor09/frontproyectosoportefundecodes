"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listProjects } from "@/services/projects.service";
import type { Project, ProjectStatus } from "@/lib/projects.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/ui/Modal";
import Header from "@/app/landing/components/Header";
import Footer from "@/app/landing/components/Footer";
import { Search, Filter, MapPin, Tag, Layers, ChevronLeft, ChevronRight, X, ArrowLeft } from "lucide-react";

export default function ProjectsPublicPage() {
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  async function load(nextPage = page) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listProjects({
        q, place, category, area,
        status: status || undefined,
        page: nextPage, pageSize,
      });
      const arr = Array.isArray(data) ? data : [];
      const published = arr.filter((p) => p?.published === true);
      setItems(published);
      setTotal(published.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando proyectos");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  const places = useMemo(() => Array.from(new Set(items.map((i) => i.place).filter(Boolean))).sort(), [items]);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(), [items]);
  const areas = useMemo(() => Array.from(new Set(items.map((i) => i.area).filter(Boolean))).sort(), [items]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getStatusColor = (s: string) => {
    switch (s) {
      case "EN_PROCESO": return "bg-green-100 text-green-700 border-green-200";
      case "FINALIZADO": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PAUSADO": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-1/4 w-40 h-40 bg-green-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm text-green-300 text-sm font-medium rounded-full mb-6">
            Explora nuestro trabajo
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Nuestros Proyectos
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Descubre los proyectos de conservacion, educacion ambiental y trabajo comunitario que estamos desarrollando.
          </p>
          <div className="mt-8">
            <Link href="/#inicio">
            </Link>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 50L48 45C96 40 192 30 288 35C384 40 480 60 576 65C672 70 768 60 864 50C960 40 1056 30 1152 35C1248 40 1344 60 1392 70L1440 80V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8 mb-10">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-12 h-12 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500/20 text-base"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`h-12 px-5 rounded-xl border-slate-200 transition-all ${showFilters ? 'bg-slate-100 border-slate-300' : 'hover:bg-slate-50'}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  onClick={() => { setPage(1); load(1); }}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/25 transition-all"
                >
                  Buscar
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                    >
                      <option value="">Todos los lugares</option>
                      {places.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Todas las categorias</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    >
                      <option value="">Todas las areas</option>
                      {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <select
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}
                  >
                    <option value="">Todos los estados</option>
                    <option value="EN_PROCESO">En proceso</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="PAUSADO">Pausado</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => { setQ(""); setPlace(""); setCategory(""); setArea(""); setStatus(""); setPage(1); load(1); }}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-700 font-medium mb-2">Error al cargar proyectos</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <Button onClick={() => load(1)} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Reintentar
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500">Cargando proyectos...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No se encontraron proyectos</p>
              <p className="text-slate-500 text-sm mt-1">Intenta ajustar los filtros de busqueda</p>
            </div>
          ) : (
            <>
              {/* Projects Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
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
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                          <Layers className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                      {p.status && (
                        <span className={`absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(p.status)}`}>
                          {p.status === "EN_PROCESO" ? "En proceso" : p.status === "FINALIZADO" ? "Finalizado" : p.status === "PAUSADO" ? "Pausado" : p.status}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {p.title}
                      </h3>
                      {p.summary && (
                        <p className="text-slate-600 text-sm line-clamp-2 mb-4">{p.summary}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {p.place && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                            <MapPin className="w-3 h-3" />{p.place}
                          </span>
                        )}
                        {p.category && (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">{p.category}</span>
                        )}
                      </div>
                      <Button
                        onClick={() => { setSelected(p); setOpen(true); }}
                        variant="outline"
                        className="w-full rounded-xl border-slate-200 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-10">
                <Button
                  disabled={page <= 1}
                  onClick={() => { const n = page - 1; setPage(n); load(n); }}
                  variant="outline"
                  className="h-10 px-4 rounded-xl disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <span className="text-sm text-slate-600 font-medium">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => { const n = page + 1; setPage(n); load(n); }}
                  variant="outline"
                  className="h-10 px-4 rounded-xl disabled:opacity-50"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={selected?.title ?? ""}>
        {selected?.coverUrl && (
          <img src={selected.coverUrl} alt={selected.title} className="w-full h-56 object-cover rounded-xl mb-5" />
        )}
        {selected?.summary && (
          <p className="text-slate-600 mb-4">{selected.summary}</p>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {selected?.place && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
              <MapPin className="w-3.5 h-3.5" />{selected.place}
            </span>
          )}
          {selected?.category && (
            <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg">{selected.category}</span>
          )}
          {selected?.area && (
            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg">{selected.area}</span>
          )}
          {selected?.status && (
            <span className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${getStatusColor(selected.status)}`}>
              {selected.status === "EN_PROCESO" ? "En proceso" : selected.status === "FINALIZADO" ? "Finalizado" : selected.status === "PAUSADO" ? "Pausado" : selected.status}
            </span>
          )}
        </div>
        {selected?.content && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selected.content}</p>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
