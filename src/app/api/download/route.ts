// src/app/api/download/route.ts
import { NextRequest } from "next/server";

// Candidatos para el origen del backend, en orden de prioridad.
// La variable que YA está configurada en Dokploy es NEXT_PUBLIC_API_URL.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "");
const FILES_BASE = (process.env.NEXT_PUBLIC_FILES_BASE_URL ?? "").replace(/\/+$/, "");

function backendOrigin() {
  const candidates = [
    FILES_BASE,
    API_URL.replace(/\/api\/?$/, ""),
    API_BASE.replace(/\/api\/?$/, ""),
  ];
  for (const c of candidates) {
    try {
      if (!c) continue;
      const u = new URL(c);
      return `${u.protocol}//${u.host}`;
    } catch {}
  }
  return "";
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url") ?? "";
  if (!urlParam) return new Response("Missing url", { status: 400 });

  let fetchUrl: string;
  try {
    if (/^https?:\/\//i.test(urlParam)) {
      fetchUrl = urlParam;
    } else {
      const origin = backendOrigin() || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      fetchUrl = new URL(urlParam, origin).href;
    }
  } catch {
    return new Response("Bad url", { status: 400 });
  }

  // Seguridad básica: sólo permitir el host del backend
  try {
    const allowedOrigin = backendOrigin();
    if (allowedOrigin) {
      const t = new URL(fetchUrl);
      const a = new URL(allowedOrigin);
      if (t.host !== a.host || t.protocol !== a.protocol) {
        return new Response("Forbidden host", { status: 403 });
      }
    }
  } catch {}

  const resp = await fetch(fetchUrl, { cache: "no-store" });
  if (!resp.ok || !resp.body) {
    return new Response("File not found", { status: resp.status });
  }

  let filename = req.nextUrl.searchParams.get("filename") || "";
  if (!filename) {
    try {
      filename = decodeURIComponent(new URL(fetchUrl).pathname.split("/").pop() || "archivo");
    } catch {
      filename = "archivo";
    }
  }

  const contentType = resp.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = resp.headers.get("content-length") ?? undefined;

  const headers = new Headers();
  headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);
  headers.set("content-disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
  headers.set("cache-control", "no-store");

  return new Response(resp.body, { status: 200, headers });
}
