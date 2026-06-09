"use client";

import { useState, useMemo } from "react";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecoverPasswordModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setErrMsg("Ingresa un correo válido.");
      return;
    }

    setSubmitting(true);
    try {
      // Tu rewrite /api-auth -> http://localhost:4000/auth
      const res = await axios.post(
        "/api-auth/forgot-password",
        { email: clean },
        { headers: { "Content-Type": "application/json" } }
      );

      // Éxito: muestra confirmación
      if (res.status >= 200 && res.status < 300) {
        setOkMsg("Te enviamos un enlace de recuperación a tu correo.");
      } else {
        setErrMsg(res.data?.message || "No se pudo procesar la solicitud.");
      }
    } catch (err: any) {
      // Aquí capturamos explícitamente el 400 "correo no registrado"
      const status = err?.response?.status;
      const msgRaw =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo procesar la solicitud.";
      const msg = Array.isArray(msgRaw) ? msgRaw.join(", ") : msgRaw;

      if (status === 400) {
        // 💡 Mensaje claro cuando el correo NO existe
        setErrMsg(msg || "El correo no está registrado.");
      } else {
        setErrMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recuperar contraseña</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          Ingresa tu correo. Si existe una cuenta asociada, te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Correo electrónico</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="w-full rounded border p-2"
              placeholder="tu@correo.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={`w-full rounded p-2 text-white ${
              !canSubmit || submitting
                ? "bg-emerald-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {submitting ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>

        {okMsg && <p className="mt-3 text-sm text-emerald-600">{okMsg}</p>}
        {errMsg && <p className="mt-3 text-sm text-red-600">{errMsg}</p>}

        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-slate-500 hover:underline">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
