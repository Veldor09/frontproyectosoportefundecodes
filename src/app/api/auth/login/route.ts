/**
 * Ruta Next.js que actúa de proxy del login hacia el backend NestJS
 * y además deja una cookie httpOnly con el JWT, por si se usa SSR.
 *
 * NOTA: El flujo principal de login del frontend usa axios directamente
 * contra el backend (src/services/auth.service.ts) y guarda el token en
 * localStorage. Esta ruta es una alternativa y debe seguir el mismo
 * contrato que el backend (prefijo /api obligatorio).
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
    if (!raw) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_API_URL no configurada" },
        { status: 500 },
      );
    }

    // Aseguramos el prefijo /api del backend NestJS (globalPrefix).
    const apiRoot = raw.endsWith("/api") ? raw : `${raw}/api`;

    const res = await fetch(`${apiRoot}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || "Credenciales inválidas o usuario no verificado";
      return NextResponse.json({ message: msg }, { status: res.status });
    }

    const token = data?.access_token;
    if (!token) {
      return NextResponse.json(
        { message: "Respuesta inválida del servidor" },
        { status: 500 },
      );
    }

    // Devolvemos el payload completo (incluye `user`) para que el cliente
    // pueda poblar su estado sin tener que pedir /auth/me después.
    const response = NextResponse.json(data);
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
