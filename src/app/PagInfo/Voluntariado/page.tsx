"use client";

import { Leaf, Microscope, BookOpen, Users, ChevronDown, Heart, MapPin, Sparkles } from "lucide-react";
import Header from "@/app/landing/components/Header";
import Footer from "@/app/landing/components/Footer";
import FormularioVoluntarios from "./VolunteerForm";
import ProgramasCatalogo from "./ProgramasCatalogo";

const volunteerTypes = [
  {
    t: "Conservación y manejo de áreas protegidas",
    d: "Apoyo en patrullajes, limpieza de playas y apoyo en parques y refugios.",
    icon: Leaf,
  },
  {
    t: "Monitoreo biológico y apoyo a investigación",
    d: "Registro de biodiversidad, monitoreo de tortugas y estudios ambientales.",
    icon: Microscope,
  },
  {
    t: "Educación y sensibilización ambiental",
    d: "Charlas, guías a visitantes, actividades con centros educativos.",
    icon: BookOpen,
  },
  {
    t: "Proyectos comunitarios y sostenibilidad",
    d: "Trabajo con comunidades, reciclaje y talleres e iniciativas productivas.",
    icon: Users,
  },
];

const supportAreas = [
  {
    t: "Parques y refugios costeros",
    d: "Apoyo en la conservación de tortugas marinas y ecosistemas de playa.",
    icon: "🐢",
  },
  {
    t: "Bosques y cuencas",
    d: "Colaboración en actividades de restauración y protección de nacientes y bosques.",
    icon: "🌳",
  },
  {
    t: "Comunidades locales",
    d: "Trabajo conjunto con organizaciones y grupos locales en iniciativas sostenibles.",
    icon: "🤝",
  },
  {
    t: "Gestión y apoyo institucional",
    d: "Apoyo en tareas organizativas, comunicación y seguimiento de proyectos.",
    icon: "📋",
  },
];

export default function VoluntariadoPage() {
  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white/90">Únete a nuestra causa</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Voluntariado en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                FUNDECODES
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Sé parte de los esfuerzos reales de conservación y educación ambiental en Costa Rica.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#formulario"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5"
              >
                <Heart className="w-5 h-5" />
                Quiero ser voluntario
              </a>
              <a
                href="#sobre-nosotros"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300"
              >
                Conocer más
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white">

        {/* ¿Qué es el voluntariado? */}
        <section id="sobre-nosotros" className="py-16 sm:py-20 lg:py-24 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1.5 bg-blue-50 text-[#1e3a8a] text-sm font-semibold rounded-full mb-4">
                  Sobre nosotros
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
                  ¿Qué es el voluntariado?
                </h2>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-6 sm:p-8 lg:p-10 border border-slate-100">
                <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                  <p>
                    FUNDECODES trabaja con parques nacionales, refugios de vida silvestre
                    y comunidades locales para proteger ecosistemas marinos y terrestres.
                  </p>
                  <p>
                    Las personas voluntarias apoyan en labores como patrullajes, limpieza de playas,
                    educación ambiental, actividades con comunidades y apoyo logístico en proyectos.
                  </p>
                  <p>
                    El voluntariado busca fortalecer la ciencia ciudadana, promover la sostenibilidad y
                    sumar manos para la protección de los ecosistemas del Pacífico Norte y del Área de
                    Conservación Tempisque.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tipos de Voluntariado */}
        <section id="tipos" className="py-16 sm:py-20 lg:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
                Oportunidades
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
                Tipos de voluntariado
              </h2>
              <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                Encuentra el área que mejor se adapte a tus intereses y habilidades
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {volunteerTypes.map((item) => (
                <div
                  key={item.t}
                  className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#1e3a8a] font-bold text-lg sm:text-xl mb-2 group-hover:text-green-700 transition-colors">
                        {item.t}
                      </h3>
                      <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                        {item.d}
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Áreas donde puedes apoyar */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
              <div className="lg:w-1/3 mb-10 lg:mb-0 lg:sticky lg:top-8">
                <span className="inline-block px-4 py-1.5 bg-blue-100 text-[#1e3a8a] text-sm font-semibold rounded-full mb-4">
                  Ubicaciones
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] mb-4">
                  Áreas donde puedes apoyar
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  El voluntariado se realiza en colaboración con distintas áreas protegidas y comunidades,
                  siempre en coordinación con el personal oficial y los proyectos vigentes.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-600">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Costa Rica</span>
                </div>
              </div>

              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supportAreas.map((item) => (
                  <div
                    key={item.t}
                    className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 group"
                  >
                    <span className="text-3xl mb-3 block">{item.icon}</span>
                    <h3 className="text-green-600 font-bold text-base sm:text-lg mb-2 group-hover:text-green-700 transition-colors">
                      {item.t}
                    </h3>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      {item.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Catálogo de programas */}
        <section id="programas" className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
                Catálogo
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
                Programas disponibles
              </h2>
              <p className="mt-4 text-slate-600 max-w-xl mx-auto">
                Conoce nuestros programas activos y encuentra el que mejor se adapte a tu perfil.
              </p>
            </div>
            <ProgramasCatalogo />
          </div>
        </section>

        {/* Formulario */}
        <section id="formulario" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
                Inscripción
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a]">
                ¡Únete como voluntario(a)!
              </h2>
              <p className="mt-4 text-slate-600 max-w-xl mx-auto">
                Completa el formulario y FUNDECODES te contactará con las oportunidades disponibles
                según tu perfil, intereses y disponibilidad.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <FormularioVoluntarios />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}