// next.config.ts
import type { NextConfig } from "next";

/**
 * Usa la RAÍZ del backend (sin /api al final).
 * Ejemplo producción VPS (Nginx): NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
 * Ejemplo local:                  NEXT_PUBLIC_API_URL=http://localhost:4000
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

const isProd = process.env.NODE_ENV === "production";

const remoteImagePatterns: Array<{ protocol: "http" | "https"; hostname: string }> = [];
try {
  if (API_BASE.startsWith("http")) {
    const u = new URL(API_BASE);
    remoteImagePatterns.push({
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
    });
  }
} catch {
  /* URL inválida — ignoramos */
}
// Cloudinary por si se migra el storage en el futuro
remoteImagePatterns.push({ protocol: "https", hostname: "res.cloudinary.com" });

const nextConfig: NextConfig = {
  // TypeScript se mantiene estricto en producción: errores reales de tipos
  // (firmas, módulos no encontrados, etc.) SÍ deben bloquear el build,
  // porque son bugs de funcionalidad, no convenciones.
  typescript: { ignoreBuildErrors: !isProd },

  // ESLint NO bloquea el build: las reglas (`no-explicit-any`,
  // `no-unused-vars`, `exhaustive-deps`, `no-img-element`, etc.) son
  // convenciones de calidad, no errores de funcionalidad. Se siguen
  // ejecutando en `npm run lint` y en el editor; pero el deploy no
  // tiene que esperar a que se limpie deuda técnica histórica.
  // Si quieres recuperar el comportamiento bloqueante: pon `false`.
  eslint: { ignoreDuringBuilds: true },

  // Salida standalone para imágenes Docker pequeñas (server.js auto-contenido)
  output: "standalone",

  reactStrictMode: true,
  poweredByHeader: false, // quitar cabecera x-powered-by
  compress: true,

  images: {
    remotePatterns: remoteImagePatterns,
  },

  async rewrites() {
    return [
      // Proxy del front -> back (preserva el prefijo /api del backend NestJS)
      { source: "/api/:path*", destination: `${API_BASE}/api/:path*` },
      // Alias histórico de rutas de auth (mantiene compat con vistas antiguas)
      { source: "/api-auth/:path*", destination: `${API_BASE}/api/auth/:path*` },
    ];
  },

  async redirects() {
    return [
      {
        source: "/auth/set-password",
        destination: "/set-password",
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
