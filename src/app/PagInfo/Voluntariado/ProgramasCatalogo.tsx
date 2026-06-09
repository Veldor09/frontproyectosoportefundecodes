"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin, Users, ArrowRight } from "lucide-react";
import Modal from "@/components/ui/Modal";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

type Programa = {
  id: number | string;
  nombre: string;
  lugar?: string;
  descripcion?: string;
  limiteParticipantes?: number;
  imagenUrl?: string | null;
  voluntarios?: any[];
  _count?: { asignaciones?: number };
};

async function fetchProgramas(): Promise<Programa[]> {
  try {
    const res = await fetch(`${API_URL}/api/programa-voluntariado`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.items ?? [];
  } catch {
    return [];
  }
}

/* ── Helpers de cupos ── */
function getCuposInfo(p: Programa) {
  const asignados = Array.isArray(p.voluntarios)
    ? p.voluntarios.length
    : (p._count?.asignaciones ?? 0);
  const limite = Number(p.limiteParticipantes ?? 0);
  const sinLimite = limite === 0;
  const disponibles = sinLimite ? null : Math.max(limite - asignados, 0);
  const lleno = !sinLimite && asignados >= limite;
  return { asignados, limite, sinLimite, disponibles, lleno };
}

function CuposBadge({ p, small = false }: { p: Programa; small?: boolean }) {
  const { sinLimite, disponibles, lleno } = getCuposInfo(p);
  const base = `inline-flex items-center gap-1 rounded-full border backdrop-blur-sm font-semibold ${
    small ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
  }`;
  if (lleno)     return <span className={`${base} bg-red-100/90 text-red-700 border-red-200`}><Users className="w-3 h-3" />Cupos llenos</span>;
  if (sinLimite) return <span className={`${base} bg-blue-100/90 text-blue-700 border-blue-200`}><Users className="w-3 h-3" />Sin límite de cupos</span>;
  return <span className={`${base} bg-green-100/90 text-green-700 border-green-200`}><Users className="w-3 h-3" />{disponibles} cupo{disponibles !== 1 ? "s" : ""} disponible{disponibles !== 1 ? "s" : ""}</span>;
}

export default function ProgramasCatalogo() {
  const [items, setItems] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Programa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchProgramas()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function openModal(p: Programa) {
    setSelected(p);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="h-12 w-12 text-green-300 mb-4" />
        <p className="text-slate-500 font-medium">No hay programas disponibles en este momento.</p>
        <p className="text-slate-400 text-sm mt-1">Vuelve pronto — estamos trabajando en nuevas oportunidades.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p, i) => {
          const { lleno } = getCuposInfo(p);
          return (
            <div
              key={p.id}
              className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-green-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Imagen */}
              <div className="relative h-44 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
                {p.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imagenUrl}
                    alt={p.nombre}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                      const fb = img.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="h-full w-full items-center justify-center"
                  style={{ display: p.imagenUrl ? "none" : "flex" }}
                >
                  <Heart className="w-10 h-10 text-green-200" />
                </div>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Cupos badge */}
                <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                  lleno
                    ? "bg-red-100/90 text-red-700 border-red-200"
                    : "bg-green-100/90 text-green-700 border-green-200"
                }`}>
                  <Users className="w-3 h-3" />
                  {lleno ? "Cupos llenos" : "Disponible"}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-semibold text-[#1e3a8a] text-base leading-snug mb-1.5 break-words hyphens-auto group-hover:text-green-700 transition-colors">
                  {p.nombre}
                </h3>

                {p.lugar && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md mb-3 w-fit">
                    <MapPin className="w-3 h-3" />{p.lugar}
                  </span>
                )}

                {p.descripcion && (
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed flex-1 break-words hyphens-auto">
                    {p.descripcion}
                  </p>
                )}

                <button
                  onClick={() => openModal(p)}
                  className="mt-auto w-full py-2 px-4 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-500 hover:text-white hover:border-transparent transition-all duration-300"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de detalle */}
      <Modal open={modalOpen} onClose={closeModal} title={selected?.nombre ?? ""}>
        {selected && (
          <div className="space-y-5">
            {/* Imagen */}
            {selected.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imagenUrl}
                alt={selected.nombre}
                className="w-full h-56 object-cover rounded-xl"
              />
            )}

            {/* Badges de info */}
            <div className="flex flex-wrap gap-2">
              {selected.lugar && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
                  <MapPin className="w-3.5 h-3.5" />{selected.lugar}
                </span>
              )}
              <CuposBadge p={selected} />
            </div>

            {/* Descripción completa */}
            {selected.descripcion && (
              <div className="pt-1">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Descripción</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line break-words hyphens-auto">
                  {selected.descripcion}
                </p>
              </div>
            )}

            {/* Cupos detalle */}
            {(() => {
              const { limite, asignados, sinLimite, disponibles, lleno } = getCuposInfo(selected);
              if (sinLimite) return null;
              return (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    {asignados} de {limite} participantes inscritos
                  </span>
                  {lleno ? (
                    <span className="text-red-600 font-semibold">Sin cupos</span>
                  ) : (
                    <span className="text-green-600 font-semibold">{disponibles} libre{disponibles !== 1 ? "s" : ""}</span>
                  )}
                </div>
              );
            })()}

            {/* Botón participar */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href="#formulario"
                onClick={closeModal}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-md shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300"
              >
                {getCuposInfo(selected).lleno ? "Unirse a lista de espera" : "Quiero participar"}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
