// src/lib/phone.ts
import { formatPhoneNumberIntl } from "react-phone-number-input";

/**
 * Formatea para la tabla como: "+506 8888-8888".
 * Soporta valores E.164 (+50688888888) o sólo dígitos (50688888888 / 88888888).
 * Para otros países, convierte los espacios del formato internacional en guiones.
 */
export function formatPhoneForTable(raw?: string) {
  if (!raw) return "—";
  const s = String(raw).trim();
  const only = s.replace(/\D/g, "");

  // Si viene en E.164 (+...)
  if (s.startsWith("+")) {
    const intl = formatPhoneNumberIntl(s) || s;         // "+506 8888 8888"
    const m = intl.match(/^(\+\d+)\s+(.+)$/);
    return m ? `${m[1]} ${m[2].replace(/\s+/g, "-")}` : intl;
  }

  // Fallbacks comunes (Costa Rica y casos típicos)
  if (only.startsWith("506") && only.length === 11) {
    return `+506 ${only.slice(3, 7)}-${only.slice(7)}`; // +506 8888-8888
  }
  if (only.length === 8) {
    return `+506 ${only.slice(0, 4)}-${only.slice(4)}`; // asume CR si son 8 dígitos
  }

  // Si no podemos inferir, intenta formatear como internacional añadiendo "+"
  if (only.length > 0) {
    const intl = formatPhoneNumberIntl(`+${only}`);
    if (intl) {
      const m = intl.match(/^(\+\d+)\s+(.+)$/);
      return m ? `${m[1]} ${m[2].replace(/\s+/g, "-")}` : intl;
    }
  }

  return s;
}
