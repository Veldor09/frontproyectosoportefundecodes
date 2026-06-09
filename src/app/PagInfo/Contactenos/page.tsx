"use client";

import { Mail, Phone, MapPin, Clock } from "lucide-react";
import Header from "@/app/landing/components/Header";
import Footer from "@/app/landing/components/Footer";
import ContactForm from "./ContactForm";

export default function ContactenosPage() {
  const contactInfo = [
    {
      icon: Phone,
      title: "Teléfono",
      value: "+506 2222-2222",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Mail,
      title: "Correo",
      value: "info@fundecodes.org",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      value: "Guanacaste, Costa Rica",
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: Clock,
      title: "Horario",
      value: "Lun - Vie: 8am - 5pm",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-green-300 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Mail className="w-4 h-4" />
              Estamos para ayudarte
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Contáctanos
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              ¿Tienes alguna pregunta o proyecto en mente? Estamos aquí para escucharte y ayudarte.
            </p>
          </div>
        </div>

        {/* Wave divisor */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,64 C480,150 960,-20 1440,64 L1440,120 L0,120 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      <main className="relative z-10 -mt-6">
        {/* Cards de información de contacto */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-slate-200 group"
              >
                <div
                  className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">{item.title}</h3>
                <p className="text-slate-900 font-semibold text-sm lg:text-base">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contenedor principal */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 lg:p-10">
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-full">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a8a] to-blue-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Nuestra ubicación</h3>
                      <p className="text-slate-500 text-sm">Visítanos en persona</p>
                    </div>
                  </div>
                </div>
                <div className="h-[400px] lg:h-[calc(100%-88px)]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1167.9230036965548!2d-85.41807338512878!3d10.065528638250798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f9fbab8ad2ae131%3A0xd7416bb8610367e!2sFundecodes!5e0!3m2!1ses!2scr!4v1759641458147!5m2!1ses!2scr"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación FUNDECODES"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}