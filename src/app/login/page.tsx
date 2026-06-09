"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth.service";
import toast from "react-hot-toast";
import axios from "axios";
import Image from "next/image";

/* ========== Modal Recuperar contraseña ========== */

function RecoverPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const EMAIL_RE = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const canSubmit = useMemo(() => EMAIL_RE.test(email.trim()), [EMAIL_RE, email]);

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
      const res = await axios.post(
        "/api-auth/forgot-password",
        { email: clean },
        { headers: { "Content-Type": "application/json" } },
      );
      if (res.status >= 200 && res.status < 300) {
        setOkMsg("Correo enviado con éxito. Revisa tu bandeja de entrada.");
      } else {
        setErrMsg(res.data?.message || "No se pudo procesar la solicitud.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error al procesar la solicitud.";
      setErrMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recuperar contraseña</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="tu@correo.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={`w-full rounded-xl py-3 font-semibold text-white transition-all transform ${
              !canSubmit || submitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 hover:shadow-lg hover:scale-[1.02]"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando…
              </span>
            ) : (
              "Enviar enlace"
            )}
          </button>
        </form>

        {okMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-emerald-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {okMsg}
            </p>
          </div>
        )}
        
        {errMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errMsg}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Página de Login ========== */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [errores, setErrores] = useState<{ email?: string; password?: string; general?: string }>({});
  const [cargando, setCargando] = useState(false);
  const [showRecover, setShowRecover] = useState(false);

  const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});
    setCargando(true);

    const nuevosErrores: typeof errores = {};
    if (!validarEmail(email)) nuevosErrores.email = "Correo inválido";
    if (password.length < 8) nuevosErrores.password = "Mínimo 8 caracteres";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setCargando(false);
      return;
    }

    try {
      const user = await login(email, password);
      if (user) {
        toast.success(`Bienvenido, ${user.email}`);
        router.push("/admin");
      }
    } catch {
      setErrores({ general: "Credenciales incorrectas. Verifica tu email y contraseña." });
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Imagen de fondo usando Next.js Image */}
      <div className="absolute inset-0">
        <Image
          src="/Img/playa-tortuga.jpg"
          alt="Fondo playa"
          fill
          priority
          className="object-cover"
          quality={100}
        />
      </div>
      
      {/* Overlay con blur y oscurecimiento */}
      <div className="absolute inset-0 backdrop-blur-[3px] bg-black/30" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo o nombre de la organización */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-lg rounded-2xl mb-4">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">¡Bienvenido!</h1>
          <p className="text-white/90 text-sm drop-shadow">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={manejarSubmit}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6"
        >
          {errores.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errores.general}
              </p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errores.email
                    ? "border-red-300 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-teal-500 focus:border-transparent"
                }`}
                placeholder="tu@correo.org"
                required
                autoComplete="email"
              />
            </div>
            {errores.email && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errores.email}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={mostrarPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errores.password
                    ? "border-red-300 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-teal-500 focus:border-transparent"
                }`}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarPass((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarPass ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            {errores.password && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errores.password}
              </p>
            )}
          </div>

          {/* Botón Entrar */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-all disabled:cursor-not-allowed"
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Entrando…
              </span>
            ) : (
              "Entrar"
            )}
          </button>

          {/* Olvidaste tu contraseña */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowRecover(true)}
              className="text-sm text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-white drop-shadow-lg text-xs mt-6">
          © {new Date().getFullYear()} Sistema de Gestión. Todos los derechos reservados.
        </p>
      </div>

      <RecoverPasswordModal open={showRecover} onClose={() => setShowRecover(false)} />
    </main>
  );
}