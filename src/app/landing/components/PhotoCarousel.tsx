"use client";
import { useRef, useEffect, useState } from "react";

export type CarouselPhoto = { id: string; src: string; alt?: string };

export default function PhotoCarousel({ photos }: { photos?: CarouselPhoto[] }) {
  const list: CarouselPhoto[] =
    photos?.filter(p => !!p.src) ?? [
      { id: "1", src: "/Img/sinac.png", alt: "SINAC" },
      { id: "2", src: "/Img/CostaRica-PorSiempre.png", alt: "Costa Rica Por Siempre" },
      { id: "3", src: "/Img/ACT logo.png", alt: "ACT" },
      { id: "4", src: "/Img/Fideicomiso CR.png", alt: "Fideicomiso CR" },
      { id: "5", src: "/Img/ACG-logo.png", alt: "ACG" },
      { id: "6", src: "/Img/CanjeNaturaleza.png", alt: "Canje Naturaleza" },
      { id: "7", src: "/Img/OlasVerdes.jpg", alt: "Olas Verdes" },
      { id: "8", src: "/Img/Harmony.jpg", alt: "Harmony" },
      { id: "9", src: "/Img/Ramsar_logo.svg.png", alt: "Ramsar" },
      { id: "10", src: "/Img/RIU.png", alt: "RIU" },
    ];

  const ITEM_WIDTH = 176 + 20; // w-44 (176px) + gap-5 (20px)
  const SPEED = 40; // px per second

  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const totalWidth = list.length * ITEM_WIDTH;

  const applyTransform = () => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }
  };

  const animate = (time: number) => {
    if (!pausedRef.current) {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000;
        offsetRef.current = (offsetRef.current + SPEED * delta) % totalWidth;
        applyTransform();
      }
      lastTimeRef.current = time;
    } else {
      lastTimeRef.current = null;
    }
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const skip = (direction: "left" | "right") => {
    const amount = ITEM_WIDTH * 2;
    if (direction === "right") {
      offsetRef.current = (offsetRef.current + amount) % totalWidth;
    } else {
      offsetRef.current = (offsetRef.current - amount + totalWidth) % totalWidth;
    }
    applyTransform();
  };

  return (
    <section className="relative bg-white rounded-2xl shadow-sm mx-4 sm:mx-6">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 rounded-t-2xl" />
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-green-50 rounded-full opacity-50 blur-3xl pointer-events-none" />

      <div className="relative px-8 md:px-10 pt-10 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            Nuestros <span className="text-blue-600">Aliados</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1.5">
            Organizaciones que confían y trabajan junto a nosotros
          </p>
        </div>

        <div className="relative overflow-hidden">
          {/* Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Flecha izquierda */}
          <button
            onClick={() => skip("left")}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-100 text-gray-500 hover:text-green-600 hover:border-green-200 transition-all duration-200"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Flecha derecha */}
          <button
            onClick={() => skip("right")}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-100 text-gray-500 hover:text-green-600 hover:border-green-200 transition-all duration-200"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Track — triplicado para loop infinito sin saltos */}
          <div
            ref={trackRef}
            className="flex gap-5"
            style={{ width: `${totalWidth * 3}px` }}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            {[...list, ...list, ...list].map((foto, idx) => (
              <div
                key={`${foto.id}-${idx}`}
                style={{ width: "176px", flexShrink: 0 }}
                className="h-28 bg-white rounded-2xl hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 p-4 flex items-center justify-center"
              >
                <img
                  src={foto.src || "/placeholder.svg"}
                  alt={foto.alt || "Aliado"}
                  className="max-w-full max-h-full object-contain opacity-75 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}