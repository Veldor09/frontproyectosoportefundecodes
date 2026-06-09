// Endpoint de salud del frontend.
//
// Lo consume el HEALTHCHECK del Dockerfile y, si está activado, también
// Traefik/Dokploy. Debe ser ligero, sin tocar la red, y devolver JSON
// con `ok:true` en 200.
//
// La ruta /api/* del front llega aquí ANTES de aplicar los rewrites de
// next.config.ts (los rewrites solo se ejecutan cuando no existe ruta local).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "frontfundecodesdigital",
      time: new Date().toISOString(),
    },
    { status: 200 },
  );
}
