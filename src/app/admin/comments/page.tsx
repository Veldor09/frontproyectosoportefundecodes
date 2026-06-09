"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/lib/media-url";

type CommentStatus = "PENDIENTE" | "APROBADO" | "DENEGADO";

type AdminComment = {
  id: string;
  author: string;
  text: string;
  status: CommentStatus;
  visible?: boolean;
  createdAt?: string;
  attachmentUrl?: string | null;
};

type CommentsResponse = {
  items: AdminComment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/comments`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function AdminCommentsPage() {
  const [status, setStatus] = useState<CommentStatus>("PENDIENTE");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(8);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  });

  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);

  const token = useMemo(() => getToken(), []);

  async function loadComments() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        status,
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.set("search", search.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`${API_BASE}/admin?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("No se pudieron cargar los comentarios");
      }

      const data: CommentsResponse = await res.json();

      setComments(Array.isArray(data?.items) ? data.items : []);
      setMeta(
        data?.meta ?? {
          total: 0,
          page: 1,
          limit,
          totalPages: 1,
        }
      );
    } catch {
      setError("No se pudieron cargar los comentarios.");
      setComments([]);
      setMeta({
        total: 0,
        page: 1,
        limit,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }

  async function approveComment(id: string) {
    try {
      setProcessingId(id);
      setError(null);

      const res = await fetch(`${API_BASE}/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo aprobar el comentario");
      }

      await loadComments();
    } catch {
      setError("No se pudo aprobar el comentario.");
    } finally {
      setProcessingId(null);
    }
  }

  async function denyComment(id: string) {
    try {
      setProcessingId(id);
      setError(null);

      const res = await fetch(`${API_BASE}/${id}/deny`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo denegar el comentario");
      }

      await loadComments();
    } catch {
      setError("No se pudo denegar el comentario.");
    } finally {
      setProcessingId(null);
    }
  }

  async function confirmDeleteComment() {
    if (!commentToDelete) return;

    try {
      setProcessingId(commentToDelete.id);
      setError(null);

      const res = await fetch(`${API_BASE}/${commentToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar el comentario");
      }

      setCommentToDelete(null);
      await loadComments();
    } catch {
      setError("No se pudo eliminar el comentario.");
    } finally {
      setProcessingId(null);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    loadComments();
  }, [status, search, from, to, page]);

  function formatDate(date?: string) {
    if (!date) return "Sin fecha";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Sin fecha";

    return parsed.toLocaleString("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getStatusClasses(value: CommentStatus) {
    switch (value) {
      case "PENDIENTE":
        return "border border-amber-200 bg-amber-100 text-amber-800";
      case "APROBADO":
        return "border border-green-200 bg-green-100 text-green-800";
      case "DENEGADO":
        return "border border-red-200 bg-red-100 text-red-800";
      default:
        return "border border-slate-200 bg-slate-100 text-slate-800";
    }
  }

  const COMMENT_TABS: { key: CommentStatus; label: string }[] = [
    { key: "PENDIENTE", label: "Pendientes" },
    { key: "APROBADO",  label: "Aprobados" },
    { key: "DENEGADO",  label: "Denegados" },
  ];

  return (
    <>
      {/* ── Nav bar VoluntariadoNav-style ── */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Título centrado */}
          <div className="text-center py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Gestión de Comentarios
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Modera, aprueba o deniega comentarios de la comunidad antes de su publicación.
            </p>
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-center h-16">
              <Link href="/admin" className="absolute left-0">
                <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium rounded-md text-sm flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Dashboard
                </button>
              </Link>
              <nav className="flex gap-2">
                {COMMENT_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatus(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                      status === key
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden pb-4">
            <div className="mb-3">
              <Link href="/admin">
                <button className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200 px-4 py-2.5 font-medium rounded-md text-sm flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Dashboard
                </button>
              </Link>
            </div>
            <nav className="flex flex-col sm:flex-row gap-2">
              {COMMENT_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm flex-1 ${
                    status === key
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar comentario
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por autor o contenido"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Desde
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setPage(1);
                setFrom(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Hasta
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setPage(1);
                setTo(e.target.value);
              }}
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap gap-3">
<Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              Buscar
            </Button>

            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={handleClearFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        </form>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p>
          Total encontrados: <span className="font-semibold">{meta.total}</span>
        </p>
        <p>
          Página <span className="font-semibold">{meta.page}</span> de{" "}
          <span className="font-semibold">{meta.totalPages}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <MessageSquare className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            No hay comentarios en esta lista
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Cuando existan comentarios con este filtro, aparecerán aquí.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-5">
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h2 className="break-all text-lg font-semibold text-slate-900">
                        {comment.author}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                          comment.status
                        )}`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    <div className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="whitespace-pre-wrap break-all text-sm leading-relaxed text-slate-700 sm:text-base">
                        {comment.text}
                      </p>
                    </div>

                    {comment.attachmentUrl && (() => {
                      const mediaUrl = resolveMediaUrl(comment.attachmentUrl)!;
                      return (
                        <div className="mt-3">
                          {/\.(mp4|webm)(\?|$)/i.test(mediaUrl) ? (
                            <video
                              src={mediaUrl}
                              controls
                              className="max-w-xs max-h-48 rounded-xl border border-slate-200"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaUrl}
                              alt="Adjunto"
                              className="max-w-xs max-h-48 rounded-xl border border-slate-200 object-cover cursor-pointer"
                              onClick={() => window.open(mediaUrl, "_blank")}
                            />
                          )}
                        </div>
                      );
                    })()}

                    <p className="mt-4 text-sm text-slate-500">
                      Enviado: {formatDate(comment.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-[170px]">
                    {status !== "APROBADO" && (
                      <Button
                        type="button"
                        onClick={() => approveComment(comment.id)}
                        disabled={processingId === comment.id}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        {processingId === comment.id ? "Procesando..." : "Aprobar"}
                      </Button>
                    )}

                    {status !== "DENEGADO" && (
                      <Button
                        type="button"
                        onClick={() => denyComment(comment.id)}
                        disabled={processingId === comment.id}
                        className="border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                      >
                        {processingId === comment.id ? "Procesando..." : "Denegar"}
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={() => setCommentToDelete(comment)}
                      disabled={processingId === comment.id}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              disabled={meta.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>

            <span className="text-sm text-slate-600">
              Página {meta.page} de {meta.totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
            >
              Siguiente
            </Button>
          </section>
        </>
      )}

      {commentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Confirmar eliminación
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                ¿Seguro que deseas eliminar este comentario?
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="break-all text-sm font-semibold text-slate-800">
                  {commentToDelete.author}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-all text-sm text-slate-600">
                  {commentToDelete.text}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => setCommentToDelete(null)}
                  disabled={processingId === commentToDelete.id}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={confirmDeleteComment}
                  disabled={processingId === commentToDelete.id}
                >
                  {processingId === commentToDelete.id ? "Eliminando..." : "Sí, eliminar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
