'use client'

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import API from "@/services/api"
import { toast } from "sonner"

/* ===== Límites realistas ===== */
const LIMITS = {
  name:   { min: 3,  max: 40 },
  email:  {        max: 50 },
  subject:{ min: 3,  max: 40 },
  message:{ min: 10, max: 1000 },
};

type ContactFormData = {
  name: string
  email: string
  subject: string
  message: string
};

type Props = {
  /** Si lo omites, no se muestra encabezado en el Card */
  title?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: ContactFormData) {
  const errs: Partial<Record<keyof ContactFormData, string>> = {};

  const name = values.name.trim();
  if (name.length < LIMITS.name.min) errs.name = `El nombre debe tener al menos ${LIMITS.name.min} caracteres`;
  else if (name.length > LIMITS.name.max) errs.name = `El nombre no puede exceder ${LIMITS.name.max} caracteres`;

  const email = values.email.trim();
  if (!EMAIL_RE.test(email)) errs.email = "Ingresa un correo válido (ej. nombre@dominio.com)";
  else if (email.length > LIMITS.email.max) errs.email = `El correo no puede exceder ${LIMITS.email.max} caracteres`;

  const subject = values.subject.trim();
  if (subject.length < LIMITS.subject.min) errs.subject = `El asunto debe tener al menos ${LIMITS.subject.min} caracteres`;
  else if (subject.length > LIMITS.subject.max) errs.subject = `El asunto no puede exceder ${LIMITS.subject.max} caracteres`;

  const message = values.message;
  if (message.trim().length < LIMITS.message.min) errs.message = `El mensaje debe tener al menos ${LIMITS.message.min} caracteres`;
  else if (message.length > LIMITS.message.max) errs.message = `El mensaje no puede exceder ${LIMITS.message.max} caracteres`;

  return errs;
}

const Counter = ({ current, max, min }: { current: number; max: number; min?: number }) => (
  <div className={`text-xs mt-1 ${current > max ? 'text-red-600' : min && current > 0 && current < min ? 'text-orange-600' : 'text-gray-500'}`}>
    {current}/{max}{min ? ` (mín: ${min})` : ""}
  </div>
);

export default function ContactForm({ title }: Props) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as keyof ContactFormData;
    const v = validate(formData);
    setErrors(prev => ({ ...prev, [field]: v[field] }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // HTML5 primero
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    // Custom después
    const v = validate(formData);
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: `${formData.subject.trim()}\n\n${formData.message}`,
    };

    try {
      await API.post('/contact', payload);
      toast.success('¡Mensaje enviado con éxito!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch {
      toast.error('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      {/* Encabezado opcional */}
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          {/* Nombre */}
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              placeholder={`Tu nombre (${LIMITS.name.min}–${LIMITS.name.max} caracteres)`}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={LIMITS.name.min}
              maxLength={LIMITS.name.max}
              aria-invalid={!!errors.name}
              aria-describedby="name-error"
            />
            {errors.name && <p id="name-error" className="text-xs text-red-600 mt-1">{errors.name}</p>}
            <Counter current={formData.name.length} max={LIMITS.name.max} min={LIMITS.name.min} />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nombre@dominio.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength={LIMITS.email.max}
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
              title="Ingresa un correo válido (ej. nombre@dominio.com)"
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {errors.email && <p id="email-error" className="text-xs text-red-600 mt-1">{errors.email}</p>}
            <Counter current={formData.email.length} max={LIMITS.email.max} />
          </div>

          {/* Asunto */}
          <div>
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder={`Breve resumen (${LIMITS.subject.min}–${LIMITS.subject.max} caracteres)`}
              value={formData.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={LIMITS.subject.min}
              maxLength={LIMITS.subject.max}
              aria-invalid={!!errors.subject}
              aria-describedby="subject-error"
            />
            {errors.subject && <p id="subject-error" className="text-xs text-red-600 mt-1">{errors.subject}</p>}
            <Counter current={formData.subject.length} max={LIMITS.subject.max} min={LIMITS.subject.min} />
          </div>

          {/* Mensaje */}
          <div>
            <Label htmlFor="message">Mensaje *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder={`Cuéntanos cómo podemos ayudarte (${LIMITS.message.min}–${LIMITS.message.max} caracteres)`}
              rows={4}
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={LIMITS.message.min}
              maxLength={LIMITS.message.max}
              aria-invalid={!!errors.message}
              aria-describedby="message-error"
            />
            {errors.message && <p id="message-error" className="text-xs text-red-600 mt-1">{errors.message}</p>}
            <Counter current={formData.message.length} max={LIMITS.message.max} min={LIMITS.message.min} />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}