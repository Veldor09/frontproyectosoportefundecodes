"use client";

import { useState } from "react";
import API from "@/services/api";

const SIMULATE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/simulate/trigger`;

async function triggerSimulation(type: 'error_rate' | 'memory' | 'latency') {
  try {
    await fetch(SIMULATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
  } catch { /* fire-and-forget */ }
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2, XCircle } from "lucide-react";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validateEmail,
  validatePhone,
} from "@/lib/form-validation";

type FieldErrors = {
  nombre?: string | null;
  correo?: string | null;
  telefono?: string | null;
  mensaje?: string | null;
};

export default function ContactForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    mensaje: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [simulationAlert, setSimulationAlert] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    // Sanitiza en vivo para impedir caracteres prohibidos
    let next = value;
    if (name === "nombre") next = sanitizeName(value);
    else if (name === "telefono") next = sanitizePhone(value);

    setFormData((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: null }));

    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    let err: string | null = null;
    if (name === "nombre") err = validateName(value);
    else if (name === "correo") err = validateEmail(value);
    else if (name === "telefono") err = validatePhone(value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  }

  function validateAll(): boolean {
    const next: FieldErrors = {
      nombre: validateName(formData.nombre),
      correo: validateEmail(formData.correo),
      telefono: validatePhone(formData.telefono),
      mensaje: formData.mensaje.trim().length < 5
        ? "El mensaje debe tener al menos 5 caracteres."
        : null,
    };
    setErrors(next);
    return !next.nombre && !next.correo && !next.telefono && !next.mensaje;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validateAll()) {
      setErrorMessage("Corrige los errores resaltados antes de enviar.");
      return;
    }

    setLoading(true);

    const payloadBackend = {
      tipoFormulario: "CONTACTO",
      nombre: formData.nombre.trim(),
      correo: formData.correo.trim().toLowerCase(),
      telefono: formData.telefono.trim(),
      payload: {
        mensaje: formData.mensaje.trim(),
      },
    };

    try {
      await API.post("/respuestas-formulario", payloadBackend);

      setSuccessMessage(
        "Mensaje enviado correctamente. Te responderemos pronto."
      );

      // 🟠 Dispara simulación de Respuestas Lentas en background
      triggerSimulation('latency');
      setSimulationAlert(true);
      setTimeout(() => setSimulationAlert(false), 8000);

      setFormData({
        nombre: "",
        correo: "",
        telefono: "",
        mensaje: "",
      });
      setErrors({});
    } catch (error: any) {
      console.log("ERROR BACKEND:", error?.response?.data);

      setErrorMessage(
        "Error al enviar el mensaje. Por favor, intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
          <Send className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Envíanos un mensaje
          </h2>
          <p className="text-slate-500 text-sm">
            Te responderemos lo antes posible
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="nombre"
              className="text-slate-700 font-medium text-sm"
            >
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              maxLength={120}
              aria-invalid={!!errors.nombre}
              required
              className={`h-12 bg-slate-50/50 focus:bg-white focus:ring-green-500/20 rounded-xl transition-all duration-200 ${
                errors.nombre
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-green-500"
              }`}
            />
            {errors.nombre && (
              <p className="text-xs text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="correo"
              className="text-slate-700 font-medium text-sm"
            >
              Correo electrónico <span className="text-red-500">*</span>
            </Label>
            <Input
              id="correo"
              name="correo"
              type="email"
              placeholder="tu@email.com"
              value={formData.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              maxLength={254}
              aria-invalid={!!errors.correo}
              required
              className={`h-12 bg-slate-50/50 focus:bg-white focus:ring-green-500/20 rounded-xl transition-all duration-200 ${
                errors.correo
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-green-500"
              }`}
            />
            {errors.correo && (
              <p className="text-xs text-red-600">{errors.correo}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="telefono"
            className="text-slate-700 font-medium text-sm"
          >
            Teléfono <span className="text-red-500">*</span>
          </Label>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            placeholder="Ej. 88888888 o +50688888888"
            value={formData.telefono}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="tel"
            inputMode="tel"
            maxLength={16}
            aria-invalid={!!errors.telefono}
            required
            className={`h-12 bg-slate-50/50 focus:bg-white focus:ring-green-500/20 rounded-xl transition-all duration-200 ${
              errors.telefono
                ? "border-red-300 focus:border-red-400"
                : "border-slate-200 focus:border-green-500"
            }`}
          />
          {errors.telefono && (
            <p className="text-xs text-red-600">{errors.telefono}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="mensaje"
            className="text-slate-700 font-medium text-sm"
          >
            Tu mensaje <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="mensaje"
            name="mensaje"
            placeholder="Cuéntanos en qué podemos ayudarte..."
            rows={6}
            value={formData.mensaje}
            onChange={handleChange}
            maxLength={2000}
            aria-invalid={!!errors.mensaje}
            required
            className={`resize-none bg-slate-50/50 focus:bg-white focus:ring-green-500/20 rounded-xl transition-all duration-200 ${
              errors.mensaje
                ? "border-red-300 focus:border-red-400"
                : "border-slate-200 focus:border-green-500"
            }`}
          />
          {errors.mensaje && (
            <p className="text-xs text-red-600">{errors.mensaje}</p>
          )}
        </div>
      </div>

      {successMessage ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium text-sm">
            {successMessage}
          </p>
        </div>
      ) : null}

      {simulationAlert ? (
        <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl flex items-start gap-3">
          <span className="text-orange-500 text-lg flex-shrink-0">⚡</span>
          <div>
            <p className="text-orange-800 font-semibold text-sm">Simulación de incidente activada</p>
            <p className="text-orange-700 text-xs mt-0.5">
              Se está simulando <strong>respuestas lentas del API</strong>. Revisa Grafana en 1–2 minutos para ver la alerta <code>SlowApiResponses</code>.
            </p>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 font-medium text-sm">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-emerald-600 text-white font-semibold h-14 text-base rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar mensaje
          </span>
        )}
      </Button>
    </form>
  );
}