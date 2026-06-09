"use client";
import { Target, Users, Sparkles, Heart, Award, Building2, Handshake, Shield, Star, Lightbulb } from "lucide-react";

type Block = { title?: string; content?: string; imageUrl?: string };

type Props = {
  vision?: Block;
  mission?: Block;
};

export default function VisionMision({ vision, mission }: Props) {
  const titleV = vision?.title ?? "Visión";
  const contentV =
    vision?.content ??
    "Ser líder en conservación de la biodiversidad y el desarrollo sostenible con amplia participación de actores sociales.";

  const titleM = mission?.title ?? "Misión";
  const contentM =
    mission?.content ??
    "Somos una organización no gubernamental sin fines de lucro que gestiona recursos vinculados a la conservación de la biodiversidad marina y terrestre, impulsando el desarrollo sostenible con participación de actores sociales.";

  const principios = [
    { nombre: "Transparencia", icon: Shield },
    { nombre: "Armonía", icon: Heart },
    { nombre: "Credibilidad", icon: Award },
    { nombre: "Competitividad", icon: Star },
  ];

  const valores = [
    { nombre: "Empatía", icon: Heart },
    { nombre: "Liderazgo", icon: Lightbulb },
    { nombre: "Compromiso", icon: Handshake },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-50 to-white mx-4 sm:mx-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-50 rounded-full opacity-20 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Lo que nos <span className="text-blue-600">define</span> y{" "}
            <span className="text-green-600">guía</span>
          </h2>
        </div>

        {/* QUIENES SOMOS */}
        <div className="mb-16">
          <div className="relative bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600" />
            
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  ¿Quiénes <span className="text-blue-600">Somos</span>?
                </h3>
                
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Somos una <span className="font-semibold text-gray-800">Organización no gubernamental de carácter privado</span>, creada en el año 2000, en la que procuramos el equilibrio de la conservación de la <span className="font-semibold text-green-600">Biodiversidad</span> a perpetuidad, mediante la gestión de fondos, alianzas con empresas privadas, sociedad civil y el Gobierno.
                  </p>
                  <p>
                    Cumplimos nuestra misión movilizando recursos de donantes, de organismos nacionales e internacionales que son canalizados para <span className="font-semibold text-blue-600">programas de conservación</span>.
                  </p>
                </div>

                {/* Stats or highlights */}
                <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="text-sm text-gray-500">Fundada en <span className="font-semibold text-gray-700">2000</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    <span className="text-sm text-gray-500">ONG sin fines de lucro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="text-sm text-gray-500">Conservación de biodiversidad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VISION Y MISION */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* VISION CARD */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400" />
            <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-200 mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                {titleV}
              </h3>

              <p className="text-gray-600 leading-relaxed text-base">
                {contentV}
              </p>

              <div className="flex items-center gap-2 mt-8">
                <div className="h-1 w-10 bg-blue-600 rounded-full" />
                <div className="h-1 w-6 bg-blue-400 rounded-full" />
                <div className="h-1 w-3 bg-blue-200 rounded-full" />
              </div>
            </div>
          </div>

          {/* MISSION CARD */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
            <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-green-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg shadow-green-200 mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                {titleM}
              </h3>

              <p className="text-gray-600 leading-relaxed text-base">
                {contentM}
              </p>

              <div className="flex items-center gap-2 mt-8">
                <div className="h-1 w-10 bg-green-600 rounded-full" />
                <div className="h-1 w-6 bg-green-400 rounded-full" />
                <div className="h-1 w-3 bg-green-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* VALORES Y PRINCIPIOS - Compacto */}
        <div className="relative bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Principios */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-semibold text-gray-900">Principios</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {principios.map((item, index) => (
                  <div
                    key={index}
                    className="group inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-300"
                  >
                    <item.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{item.nombre}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-16 bg-gray-200" />

            {/* Valores */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-green-600" />
                <h4 className="text-base font-semibold text-gray-900">Valores</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {valores.map((item, index) => (
                  <div
                    key={index}
                    className="group inline-flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full hover:bg-green-100 transition-colors duration-300"
                  >
                    <item.icon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">{item.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
