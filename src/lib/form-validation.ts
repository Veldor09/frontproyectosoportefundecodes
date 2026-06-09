// src/lib/form-validation.ts
//
// Validaciones cliente para los formularios públicos (voluntariado,
// contacto, etc.). Reutilizable desde cualquier form — el patrón es:
//   1) `sanitize*` corre en el `onChange` del input para impedir que el
//      usuario meta caracteres no permitidos (por ejemplo, emojis o letras
//      en un teléfono).
//   2) `validate*` corre en el `onBlur` y antes del submit, devolviendo un
//      string con el mensaje de error o `null` si todo está bien.

// ---------- Nombre ----------
//
// Solo letras (incluye acentos y ñ), espacios, apóstrofes y guiones.
// Bloquea números, símbolos y emojis. El rango \p{L} captura cualquier
// letra Unicode (compatible con apellidos extranjeros: Müller, Núñez,
// O'Connor, Jean-Paul, etc.).
const NAME_ALLOWED_REGEX = /^[\p{L}\s'’\-]+$/u;
const NAME_FORBIDDEN_REGEX = /[^\p{L}\s'’\-]/u;

export function sanitizeName(value: string): string {
  // Elimina lo no permitido conforme el usuario escribe.
  return value.replace(/[^\p{L}\s'’\-]/gu, "");
}

export function validateName(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "El nombre es obligatorio.";
  if (trimmed.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (trimmed.length > 120) return "El nombre no puede superar 120 caracteres.";
  if (!NAME_ALLOWED_REGEX.test(trimmed)) {
    return "El nombre solo puede contener letras, espacios, apóstrofes y guiones.";
  }
  if (NAME_FORBIDDEN_REGEX.test(trimmed)) {
    return "El nombre no puede contener números, símbolos ni emojis.";
  }
  return null;
}

// ---------- Correo ----------
//
// Regex razonablemente estricto: parte local sin espacios ni emojis,
// dominio con al menos un punto, TLD de 2+ letras. No pretende ser RFC
// 5322 perfecto (eso sería un kilómetro de regex), pero atrapa errores
// típicos como "juan@gmail", "juan.com", etc.
const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

export function validateEmail(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "El correo es obligatorio.";
  if (trimmed.length > 254) return "El correo es demasiado largo.";
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Ingresa un correo electrónico válido (ej. nombre@dominio.com).";
  }
  return null;
}

// ---------- Teléfono ----------
//
// Solo dígitos. Opcionalmente puede empezar con "+" para código de país.
// No permite espacios, paréntesis, guiones, letras ni emojis: si quieres
// un formato más laxo cambia este regex.
const PHONE_ALLOWED_REGEX = /^\+?\d+$/;

export function sanitizePhone(value: string): string {
  // Mantiene un "+" inicial si existe, descarta cualquier no-dígito el resto.
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D+/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function validatePhone(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "El número de teléfono es obligatorio.";
  if (!PHONE_ALLOWED_REGEX.test(trimmed)) {
    return "El teléfono solo puede contener dígitos (y opcionalmente '+' al inicio).";
  }
  // Costa Rica usa 8 dígitos; aceptamos +código + 7-15 dígitos para extranjeros.
  const digitCount = trimmed.replace(/\D+/g, "").length;
  if (digitCount < 7) return "El teléfono es demasiado corto.";
  if (digitCount > 15) return "El teléfono es demasiado largo.";
  return null;
}
