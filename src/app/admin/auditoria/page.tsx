"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchAuditoria,
  type AuditoriaItem,
  type AuditoriaQuery,
} from "./services/auditoria.api";
import ExportButton from "@/app/admin/_components/ExportButton";
import type { ExportRow } from "@/lib/export";

const AUDIT_COLS = [
  { key: "fecha",    header: "Fecha/Hora",  width: 20 },
  { key: "usuario",  header: "Usuario",     width: 24 },
  { key: "accion",   header: "Acción",      width: 24 },
  { key: "entidad",  header: "Entidad",     width: 16 },
  { key: "detalle",  header: "Detalle",     width: 40 },
  { key: "ip",       header: "IP",          width: 14 },
];

function auditToRow(item: AuditoriaItem): ExportRow {
  return {
    fecha:   item.createdAt ? new Date(item.createdAt).toLocaleString("es-CR") : "",
    usuario: item.user?.name ?? item.userName ?? item.user?.email ?? item.userEmail ?? "",
    accion:  item.accion ?? "",
    entidad: item.entidad ?? "",
    detalle: item.detalle ?? "",
    ip:      item.ip ?? "",
  };
}

/* ========= Helpers de rol (mismo patrón que el resto del admin) ========= */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getJwtRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const r = payload?.roles ?? payload?.role ?? payload?.rol;
    if (Array.isArray(r)) return r.map(String);
    if (typeof r === "string") return [r];
    return [];
  } catch {
    return [];
  }
}

function isAdmin(roles: string[]) {
  return roles.some((r) => r.toLowerCase() === "admin");
}

/* ========= Helpers de UI ========= */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function actionColor(accion: string): string {
  const a = accion.toUpperCase();
  if (a.includes("CREAR")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (a.includes("ELIMINAR")) return "bg-red-100 text-red-800 border-red-200";
  if (a.includes("APROBAR") || a.includes("APROBADA"))
    return "bg-green-100 text-green-800 border-green-200";
  if (a.includes("RECHAZAR") || a.includes("RECHAZADA") || a.includes("DEVUELTA"))
    return "bg-rose-100 text-rose-800 border-rose-200";
  if (a.includes("VALIDADA") || a.includes("VALIDAR"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (a.includes("EDITAR") || a.includes("ACTUALIZAR"))
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (a.includes("SANCION")) return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function describeUsuario(item: AuditoriaItem): string {
  return (
    item.user?.name?.trim() ||
    item.userName?.trim() ||
    item.user?.email ||
    item.userEmail ||
    "Sistema / desconocido"
  );
}

/* ========= Página ========= */
export default function AuditoriaPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  // Filtros UI
  const [q, setQ] = useState("");
  const [accion, setAccion] = useState("");
  const [entidad, setEntidad] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Query realmente aplicada (se debouncea con un botón "Aplicar" o el form submit)
  const [appliedQuery, setAppliedQuery] = useState<AuditoriaQuery>({
    page: 1,
    pageSize: 50,
  });

  const [items, setItems] = useState<AuditoriaItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verificación cliente: oculta la página si el JWT no tiene rol admin.
  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    const roles = getJwtRoles(t);
    setAllowed(isAdmin(roles));
    setAuthChecked(true);
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAuditoria({ ...appliedQuery, page, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, page, pageSize]);

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed, load]);

  const aplicarFiltros = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    setAppliedQuery({
      pageSize,
      q: q.trim() || undefined,
      accion: accion.trim() || undefined,
      entidad: entidad.trim() || undefined,
      desde: desde ? new Date(desde).toISOString() : undefined,
      hasta: hasta ? new Date(hasta + "T23:59:59").toISOString() : undefined,
    });
  };

  const limpiarFiltros = () => {
    setQ("");
    setAccion("");
    setEntidad("");
    setDesde("");
    setHasta("");
    setPage(1);
    setAppliedQuery({ page: 1, pageSize });
  };

  const rango = useMemo(() => {
    if (total === 0) return "0";
    const desdeIdx = (page - 1) * pageSize + 1;
    const hastaIdx = Math.min(page * pageSize, total);
    return `${desdeIdx}–${hastaIdx} de ${total}`;
  }, [page, pageSize, total]);

  if (!authChecked) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-500">
        Cargando…
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-lg font-semibold">Acceso restringido</h1>
          <p className="mt-1 text-sm">
            La auditoría es exclusiva del rol <b>admin</b>. Si crees que esto es
            un error, contacta a un administrador.
          </p>
          <div className="mt-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm hover:bg-red-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* ── Nav bar idéntica a VoluntariadoNav ── */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título centrado */}
          <div className="text-center py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
              <ShieldCheck className="h-7 w-7 text-amber-600" />
              Auditoría del sistema
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quién hizo qué — registro cronológico de las acciones de todos los usuarios.
            </p>
          </div>

          {/* Desktop — back button izq · recargar der */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-center h-14 pb-3">
              <Link href="/admin" className="absolute left-0">
                <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Dashboard
                </button>
              </Link>
              <div className="absolute right-0 flex items-center gap-2">
                <ExportButton
                  title="Auditoría del Sistema"
                  subtitle="Registro cronológico de acciones"
                  filename="auditoria"
                  columns={AUDIT_COLS}
                  currentRows={items.map(auditToRow)}
                  fetchAll={async () => {
                    const res = await fetchAuditoria({ ...appliedQuery, page: 1, pageSize: 9999 });
                    return res.items.map(auditToRow);
                  }}
                  pdfOrientation="landscape"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load()}
                  disabled={loading}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {loading ? "Recargando…" : "Recargar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/admin">
              <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="w-full">
              <RefreshCcw className="h-4 w-4 mr-2" />
              {loading ? "Recargando…" : "Recargar"}
            </Button>
          </div>
        </div>
      </div>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Filtros */}
      <form
        onSubmit={aplicarFiltros}
        className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Búsqueda libre
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-8"
              placeholder="usuario, acción, detalle…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Acción</label>
          <Input
            placeholder="ej. SOLICITUD_CREAR"
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Entidad</label>
          <Input
            placeholder="ej. Solicitud, Proyecto"
            value={entidad}
            onChange={(e) => setEntidad(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="lg:col-span-6 flex flex-wrap items-center gap-2">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            Aplicar filtros
          </Button>
          <Button type="button" variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
          <span className="ml-auto text-xs text-slate-500">{rango}</span>
        </div>
      </form>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 w-44">Fecha</th>
              <th className="px-4 py-3 w-52">Usuario</th>
              <th className="px-4 py-3 w-56">Acción</th>
              <th className="px-4 py-3">Detalle</th>
              <th className="px-4 py-3 w-36">Entidad</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : errorMsg ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-red-600">
                  {errorMsg}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No hay eventos para los filtros aplicados.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                    {fmtDate(it.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 truncate" title={describeUsuario(it)}>
                      {describeUsuario(it)}
                    </div>
                    {it.user?.email || it.userEmail ? (
                      <div className="text-xs text-slate-500 truncate">
                        {it.user?.email ?? it.userEmail}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${actionColor(
                        it.accion,
                      )}`}
                      title={it.accion}
                    >
                      {it.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {it.detalle ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {it.entidad ? (
                      <>
                        <div className="font-medium">{it.entidad}</div>
                        {it.entidadId && (
                          <div className="text-slate-500">#{it.entidadId}</div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span className="text-xs text-slate-500">
          Página {page} de {Math.max(totalPages, 1)} · {total} evento{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
    </>
  );
}
