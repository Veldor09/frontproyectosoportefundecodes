"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, User, Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Comment = {
  id: string;
  author: string;
  text: string;
  visible?: boolean;
  attachmentUrl?: string | null;
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/comments`;

async function apiGetComments(): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/public`, { cache: "no-store" });
  if (!res.ok) throw new Error("GET api/comments/public failed");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function apiUploadAttachment(file: File): Promise<{ url: string; key: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/upload-attachment`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al subir adjunto");
  }
  return res.json();
}

async function apiCreateComment(payload: {
  author: string;
  text: string;
  attachmentUrl?: string;
  attachmentKey?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/public`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("POST /api/comments/public failed");
}

/** Devuelve true si la URL parece ser un video */
function isVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export default function Comments({ comments }: { comments?: Comment[] }) {
  const [list, setList] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Adjunto opcional
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const fallback: Comment[] = useMemo(
    () =>
      comments?.filter((c) => c.visible !== false) ?? [
        { id: "d1", author: "María González", text: "Una experiencia increíble, el equipo fue muy profesional y atento en todo momento.", visible: true },
        { id: "d2", author: "Carlos Ramírez", text: "Quedé muy satisfecho con el servicio. Altamente recomendado.", visible: true },
        { id: "d3", author: "Ana López", text: "Excelente atención y resultados que superaron mis expectativas.", visible: true },
      ],
    [comments]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGetComments();
        if (!alive) return;
        setList(data.filter((c) => c.visible !== false));
        setLoadError(null);
      } catch {
        if (!alive) return;
        setList(fallback);
        setLoadError("No se pudieron cargar los comentarios desde el servidor. Se muestran comentarios de ejemplo.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [fallback]);

  function handleAttachChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("El adjunto no puede superar 10 MB.");
      return;
    }
    setAttachment(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setSubmitError(null);
  }

  function removeAttachment() {
    setAttachment(null);
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);
    if (attachInputRef.current) attachInputRef.current.value = "";
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);

    let attachmentUrl: string | undefined;
    let attachmentKey: string | undefined;

    // 1) Subir adjunto si existe
    if (attachment) {
      setUploadingAttach(true);
      try {
        const res = await apiUploadAttachment(attachment);
        attachmentUrl = res.url;
        attachmentKey = res.key;
      } catch (err: any) {
        setSubmitError(err?.message ?? "No se pudo subir el adjunto.");
        setSubmitting(false);
        setUploadingAttach(false);
        return;
      } finally {
        setUploadingAttach(false);
      }
    }

    // 2) Enviar comentario
    try {
      await apiCreateComment({
        author: name.trim(),
        text: text.trim(),
        ...(attachmentUrl ? { attachmentUrl, attachmentKey } : {}),
      });
      setName("");
      setText("");
      removeAttachment();
      setSubmitSuccess("Tu comentario fue enviado correctamente y está pendiente de validación.");
    } catch {
      setSubmitError("No se pudo enviar el comentario. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mx-4 sm:mx-6">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600" />

      {/* Background decoration */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-50 rounded-full opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-green-50 rounded-full opacity-40 blur-3xl pointer-events-none" />

      <div className="relative p-8 md:p-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            <span className="text-blue-600">Comentarios</span> de nuestra{" "}
            <span className="text-green-600">comunidad</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-400">Cargando comentarios…</p>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl">
                <p className="text-sm text-amber-700">{loadError}</p>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4 mb-10">
              {list.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm mb-1 break-words">{c.author}</p>
                    <p className="text-gray-600 text-sm leading-relaxed break-words">{c.text}</p>
                    {/* Adjunto aprobado */}
                    {c.attachmentUrl && (
                      <div className="mt-3">
                        {isVideo(c.attachmentUrl) ? (
                          <video
                            src={c.attachmentUrl}
                            controls
                            className="max-w-xs max-h-48 rounded-xl border border-slate-200"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.attachmentUrl}
                            alt="Adjunto"
                            className="max-w-xs max-h-48 rounded-xl border border-slate-200 object-cover cursor-pointer"
                            onClick={() => window.open(c.attachmentUrl!, "_blank")}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {list.length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Aún no hay comentarios aprobados</p>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6 md:p-8 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-green-400" />

              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Deja tu comentario
              </h3>

              {submitError && (
                <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-400 rounded-xl">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}
              {submitSuccess && (
                <div className="mb-5 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl">
                  <p className="text-sm text-green-700">{submitSuccess}</p>
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-5">
                <div>
                  <Label htmlFor="comment-name" className="text-gray-700 font-medium text-sm mb-1.5 block">
                    Nombre
                  </Label>
                  <Input
                    id="comment-name"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="comment-text" className="text-gray-700 font-medium text-sm mb-1.5 block">
                    Comentario
                  </Label>
                  <Textarea
                    id="comment-text"
                    placeholder="Escribe tu comentario..."
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                    className="resize-none bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <p className="mt-1.5 text-xs text-gray-400 text-right">{text.length}/500</p>
                </div>

                {/* Adjunto opcional */}
                <div>
                  <Label className="text-gray-700 font-medium text-sm mb-1.5 block">
                    Adjunto (imagen o video, opcional)
                  </Label>

                  {attachmentPreview ? (
                    <div className="relative inline-block">
                      {attachment?.type.startsWith("video/") ? (
                        <video src={attachmentPreview} className="max-h-32 rounded-xl border border-slate-200" controls />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachmentPreview} alt="Vista previa" className="max-h-32 rounded-xl border border-slate-200 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow"
                        title="Quitar adjunto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={attachInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                        className="hidden"
                        onChange={handleAttachChange}
                      />
                      <button
                        type="button"
                        onClick={() => attachInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-500 hover:text-blue-600 text-sm transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                        Adjuntar imagen o video
                      </button>
                      <p className="text-xs text-slate-400 mt-1">Formatos: jpg, png, webp, gif, mp4, webm · Máx. 10 MB</p>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || uploadingAttach || !name.trim() || !text.trim()}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-green-600 text-white h-11 px-7 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting || uploadingAttach ? "Enviando…" : "Enviar comentario"}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
