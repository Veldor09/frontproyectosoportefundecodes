// src/lib/image-url.ts
//
// Utilidades para normalizar URLs de imágenes pegadas por el usuario.
// Casos típicos: Google Drive entrega un link de "preview" que no sirve la
// imagen como tal; debemos convertirlo al formato "uc?id=..." para poder
// renderizarlo con un <img>.

/**
 * Convierte URLs de Google Drive con formato:
 *   https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   https://drive.google.com/open?id=<ID>
 * a un formato que el navegador puede renderizar como imagen:
 *   https://drive.google.com/uc?id=<ID>
 *
 * Si la URL no es de Drive (Imgur, Unsplash, S3, Cloudinary, etc.) se
 * devuelve sin cambios.
 */
export function normalizeImageUrl(input: string | undefined | null): string {
  const url = (input ?? "").trim();
  if (!url) return "";

  // Caso 1: /file/d/<ID>/...
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (m1?.[1]) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;

  // Caso 2: ?id=<ID>
  const m2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (m2?.[1]) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;

  // Caso 3: ya viene en formato uc?id=...; respetar
  return url;
}

/**
 * Heurística rápida: ¿la URL parece apuntar a una imagen?
 * Solo se usa para feedback en el form, NO para bloquear submit.
 */
export function looksLikeImageUrl(input: string | undefined | null): boolean {
  const url = (input ?? "").trim().toLowerCase();
  if (!url) return false;
  return (
    /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(url) ||
    url.includes("cloudinary.com") ||
    url.includes("imgur.com") ||
    url.includes("unsplash.com") ||
    url.includes("res.cloudinary.com") ||
    /drive\.google\.com\/(file\/d|uc\?)/i.test(url)
  );
}
