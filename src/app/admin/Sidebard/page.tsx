// Archivo legado.
// El componente AdminSidebar se movió a /src/app/admin/_components/AdminSidebar.tsx
// (las carpetas con prefijo "_" en el App Router de Next.js no generan rutas).
//
// Este page.tsx solo existe porque Next exigía un default export en este archivo
// y la carpeta `Sidebard/` aún no se ha eliminado. Redirige al panel admin para
// evitar 404 si alguien la tenía como bookmark.
//
// TODO: borrar la carpeta `src/app/admin/Sidebard/` cuando sea seguro.
import { redirect } from "next/navigation";

export default function SidebardLegacyRedirect(): never {
  redirect("/admin");
}
