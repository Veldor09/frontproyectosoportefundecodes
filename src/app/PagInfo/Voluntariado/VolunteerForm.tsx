"use client";

import { useState } from "react";
import API from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validateEmail,
  validatePhone,
} from "@/lib/form-validation";

type FieldErrors = {
  fullname?: string | null;
  emailvolunteer?: string | null;
  phonevolunteer?: string | null;
};

export default function VolunteerForm() {
  const [formData, setFormData] = useState({
    fullname: "",
    emailvolunteer: "",
    phonevolunteer: "",
    observations: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Sanitiza en tiempo real para impedir caracteres prohibidos
    let next = value;
    if (name === "fullname") next = sanitizeName(value);
    else if (name === "phonevolunteer") next = sanitizePhone(value);

    setFormData((prev) => ({ ...prev, [name]: next }));

    // Limpia el mensaje del campo a medida que el usuario corrige
    setErrors((prev) => ({ ...prev, [name]: null }));
    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let err: string | null = null;
    if (name === "fullname") err = validateName(value);
    else if (name === "emailvolunteer") err = validateEmail(value);
    else if (name === "phonevolunteer") err = validatePhone(value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  function validateAll(): boolean {
    const next: FieldErrors = {
      fullname: validateName(formData.fullname),
      emailvolunteer: validateEmail(formData.emailvolunteer),
      phonevolunteer: validatePhone(formData.phonevolunteer),
    };
    setErrors(next);
    return !next.fullname && !next.emailvolunteer && !next.phonevolunteer;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validateAll()) {
      setErrorMessage("Corrige los errores resaltados antes de enviar.");
      return;
    }

    setLoading(true);

    const payloadBackend = {
      tipoFormulario: "VOLUNTARIADO",
      nombre: formData.fullname.trim(),
      correo: formData.emailvolunteer.trim().toLowerCase(),
      telefono: formData.phonevolunteer.trim(),
      payload: {
        mensaje: formData.observations.trim(),
      },
    };

    try {
      await API.post("/respuestas-formulario", payloadBackend);

      setSuccessMessage(
        "Tu registro fue enviado correctamente. Pronto nos pondremos en contacto contigo."
      );

      setFormData({
        fullname: "",
        emailvolunteer: "",
        phonevolunteer: "",
        observations: "",
      });
      setErrors({});
    } catch (error: any) {
      console.log("ERROR BACKEND:", error?.response?.data);

      setErrorMessage(
        "No se pudo enviar el registro. Verifica los datos e inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputErrorClass =
    "border-red-300 focus-visible:ring-red-400 focus-visible:border-red-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="fullname">Nombre completo *</Label>
        <Input
          id="fullname"
          name="fullname"
          value={formData.fullname}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete="name"
          inputMode="text"
          maxLength={120}
          aria-invalid={!!errors.fullname}
          aria-describedby={errors.fullname ? "fullname-error" : undefined}
          className={errors.fullname ? inputErrorClass : undefined}
          required
        />
        {errors.fullname && (
          <p id="fullname-error" className="mt-1 text-xs text-red-600">
            {errors.fullname}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="emailvolunteer">Correo electrónico *</Label>
        <Input
          id="emailvolunteer"
          name="emailvolunteer"
          type="email"
          value={formData.emailvolunteer}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          aria-invalid={!!errors.emailvolunteer}
          aria-describedby={errors.emailvolunteer ? "email-error" : undefined}
          className={errors.emailvolunteer ? inputErrorClass : undefined}
          required
        />
        {errors.emailvolunteer && (
          <p id="email-error" className="mt-1 text-xs text-red-600">
            {errors.emailvolunteer}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phonevolunteer">Número de teléfono *</Label>
        <Input
          id="phonevolunteer"
          name="phonevolunteer"
          type="tel"
          value={formData.phonevolunteer}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete="tel"
          inputMode="tel"
          maxLength={16}
          placeholder="Ej. 88888888 o +50688888888"
          aria-invalid={!!errors.phonevolunteer}
          aria-describedby={errors.phonevolunteer ? "phone-error" : undefined}
          className={errors.phonevolunteer ? inputErrorClass : undefined}
          required
        />
        {errors.phonevolunteer && (
          <p id="phone-error" className="mt-1 text-xs text-red-600">
            {errors.phonevolunteer}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea
          id="observations"
          name="observations"
          rows={4}
          placeholder="Cuéntanos más sobre ti, tus motivaciones, habilidades especiales..."
          value={formData.observations}
          onChange={handleChange}
          maxLength={1000}
        />
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Registrarme como voluntario"}
      </Button>
    </form>
  );
}
