// SOLO lectura para la landing
import type { InformationalPage } from "@/app/admin/informational-page/types/informational";

// Usamos el rewrite /api/* del next.config.ts (funciona en server y en cliente)
const API_ROOT = "/api";

export async function getInformationalPagePublic(): Promise<InformationalPage> {
  const res = await fetch(`${API_ROOT}/informational-page`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store", // evita contenido stale
  });
  if (!res.ok) throw new Error("Error al cargar la página informativa pública");
  return res.json();
}
