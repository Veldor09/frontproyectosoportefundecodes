"use client";

import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer id="footer" className="relative bg-[#0f1f3d] text-white overflow-hidden mt-12">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600" />

      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-green-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-8">
        <div className="grid md:grid-cols-3 gap-10 mb-10">

          {/* Col 1 - Brand */}
          <div>
            <h3 className="text-xl font-bold mb-3 tracking-wide">
              <span className="text-blue-400">FUNDE</span><span className="text-green-400">CODES</span>
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gestionamos recursos para la conservación de la biodiversidad marina y terrestre, impulsando el desarrollo sostenible de Costa Rica.
            </p>
            <div className="flex gap-2 mt-5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
          </div>

          {/* Col 2 - Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-5">Contacto</h3>
            <div className="space-y-3">
              <a
                href="mailto:fundecodeshojancha@gmail.com"
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-green-400 transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-green-500/10 flex items-center justify-center transition-colors flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </span>
                fundecodeshojancha@gmail.com
              </a>
              <a
                href="tel:+50686703535"
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-blue-400 transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </span>
                +506 8670-3535
              </a>
              <a
                href="https://maps.app.goo.gl/RBt2xJBbgamg9hPN6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm text-slate-300 hover:text-green-400 transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-green-500/10 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </span>
                Guanacaste, Hojancha,<br />Barrio Alto del Cementerio
              </a>
            </div>
          </div>

          {/* Col 3 - Social */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-5">Síguenos</h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100064332054124&locale=es_LA"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 text-sm text-slate-300 hover:text-blue-400 transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </a>
              <a
                href="https://www.instagram.com/hojanchafundecodes?igsh=cGl4aDBtNjY1Mnp1"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-pink-600/20 border border-white/10 hover:border-pink-500/40 text-sm text-slate-300 hover:text-pink-400 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@fundecodes?_r=1&_t=ZS-96o0nirqxF3"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-sm text-slate-300 hover:text-cyan-400 transition-all duration-300"
              >
                {/* TikTok logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                </svg>
                TikTok
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>&copy; 2025 FUNDECODES. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Conservando Costa Rica
            <span className="text-green-500">🌿</span>
          </p>
        </div>
      </div>
    </footer>
  );
}