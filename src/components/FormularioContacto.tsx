"use client";

import { useState } from "react";
import { crearRespuestaFormulario } from "@/services/respuestasFormulario.service";

function validateContacto(values: {
  nombre: string;
  correo: string;
  telefono: string;
  mensaje: string;
}) {
  const errors: Record<string, string> = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (!values.correo.trim()) {
    errors.correo = "El correo es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) {
    errors.correo = "El correo no tiene un formato válido.";
  }

  if (values.telefono.trim() && values.telefono.trim().length < 8) {
    errors.telefono = "El teléfono debe tener al menos 8 caracteres.";
  }

  if (!values.mensaje.trim()) {
    errors.mensaje = "El mensaje es obligatorio.";
  } else if (values.mensaje.trim().length < 5) {
    errors.mensaje = "El mensaje debe tener al menos 5 caracteres.";
  }

  return errors;
}

export default function FormularioContacto() {
  const [values, setValues] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    mensaje: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError("");
    setSuccess("");

    const validationErrors = validateContacto(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);

      await crearRespuestaFormulario({
        tipoFormulario: "CONTACTO",
        nombre: values.nombre,
        correo: values.correo,
        telefono: values.telefono,
        payload: {
          mensaje: values.mensaje,
        },
      });

      setSuccess("Tu mensaje fue enviado correctamente.");
      setValues({
        nombre: "",
        correo: "",
        telefono: "",
        mensaje: "",
      });
      setErrors({});
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setGeneralError(backendMessage.join(", "));
      } else if (typeof backendMessage === "string") {
        setGeneralError(backendMessage);
      } else {
        setGeneralError("No se pudo enviar el formulario.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          name="nombre"
          value={values.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          className="w-full rounded border px-3 py-2"
        />
        {errors.nombre ? (
          <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
        ) : null}
      </div>

      <div>
        <input
          name="correo"
          type="email"
          value={values.correo}
          onChange={handleChange}
          placeholder="Correo"
          className="w-full rounded border px-3 py-2"
        />
        {errors.correo ? (
          <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
        ) : null}
      </div>

      <div>
        <input
          name="telefono"
          value={values.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className="w-full rounded border px-3 py-2"
        />
        {errors.telefono ? (
          <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
        ) : null}
      </div>

      <div>
        <textarea
          name="mensaje"
          value={values.mensaje}
          onChange={handleChange}
          placeholder="Mensaje"
          className="min-h-[120px] w-full rounded border px-3 py-2"
        />
        {errors.mensaje ? (
          <p className="mt-1 text-sm text-red-600">{errors.mensaje}</p>
        ) : null}
      </div>

      {generalError ? (
        <p className="text-sm text-red-600">{generalError}</p>
      ) : null}

      {success ? (
        <p className="text-sm text-green-600">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}