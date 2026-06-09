"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  isSupportedCountry,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { useCollaborators } from "../hooks/useCollaborators";
import type { Collaborator as UiCollaborator } from "../types/collaborators.types";

/* Límites y validaciones */
const LIMITS = { fullName: { min: 3, max: 80 }, email: { max: 100 } };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Identificación */
type IdType = "cedula" | "dimex" | "pasaporte" | "nite" | "juridica";
const ID_CONFIG: Record<
  IdType,
  { label: string; placeholder: string; pattern: RegExp; length: [number, number]; onlyNumbers: boolean }
> = {
  cedula:   { label: "Cédula (9–10 dígitos)", placeholder: "1-2345-6789", pattern: /^\d{9,10}$/, length: [9,10], onlyNumbers: true },
  dimex:    { label: "DIMEX (12 dígitos)",    placeholder: "123456789012", pattern: /^\d{12}$/,  length: [12,12], onlyNumbers: true },
  pasaporte:{ label: "Pasaporte (8–9 car.)",  placeholder: "A12345678",    pattern: /^[A-Za-z0-9]{8,9}$/, length: [8,9], onlyNumbers: false },
  nite:     { label: "NITE (12 dígitos)",     placeholder: "123456789012", pattern: /^\d{12}$/,  length: [12,12], onlyNumbers: true },
  juridica: { label: "Cédula jurídica (10)",  placeholder: "3101123456",   pattern: /^\d{10}$/,  length: [10,10], onlyNumbers: true },
};

/* Roles UI (sin voluntario ni colaboradorvoluntario) */
type UIRole =
  | "admin"
  | "colaboradorfactura"
  | "colaboradorvoluntariado"
  | "colaboradorproyecto"
  | "colaboradorcontabilidad"
  | "colaboradorvisitacion";

const UI_ROLES: UIRole[] = [
  "admin",
  "colaboradorfactura",
  "colaboradorvoluntariado",
  "colaboradorproyecto",
  "colaboradorcontabilidad",
  "colaboradorvisitacion",
];

/** Mapeo 1:1 al backend */
const UI_TO_API_ROLE: Record<UIRole, UIRole> = {
  admin: "admin",
  colaboradorfactura: "colaboradorfactura",
  colaboradorvoluntariado: "colaboradorvoluntariado",
  colaboradorproyecto: "colaboradorproyecto",
  colaboradorcontabilidad: "colaboradorcontabilidad",
  colaboradorvisitacion: "colaboradorvisitacion",
};

/** Etiquetas más legibles en el selector */
const ROLE_LABEL: Record<UIRole, string> = {
  admin: "Admin",
  colaboradorfactura: "Colaborador – Factura",
  colaboradorvoluntariado: "Colaborador – Voluntariado",
  colaboradorproyecto: "Colaborador – Proyecto",
  colaboradorcontabilidad: "Colaborador – Contabilidad",
  colaboradorvisitacion: "Colaborador – Visitación",
};

type Props = {
  open: boolean;
  mode: "crear" | "editar" | null;
  initial?: UiCollaborator | null;
  onClose: () => void;
  onSaved?: (action: "created" | "updated") => void;
};

type FormState = {
  fullName: string;
  email: string;
  identification: string;
  birthdate: string;
  phone: string;
  /** Todos los roles seleccionados (multi-rol). El primero es el rol principal. */
  roles: UIRole[];
};
type Field = keyof FormState;

/* Contraseña temporal */
function genTempPassword(length = 12): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const all = lower + upper + digits;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const cryptoPick = (s: string) => {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const a = new Uint32Array(1); crypto.getRandomValues(a);
      return s[a[0] % s.length];
    }
    return pick(s);
  };
  const req = [cryptoPick(lower), cryptoPick(upper), cryptoPick(digits)];
  const rest = Array.from({ length: Math.max(length - req.length, 0) }, () => cryptoPick(all));
  const pwd = [...req, ...rest];
  for (let i = pwd.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pwd[i], pwd[j]] = [pwd[j], pwd[i]]; }
  return pwd.join("");
}

/** Normaliza valores heredados (ADMIN/COLABORADOR) o desconocidos → default: colaboradorproyecto */
function normalizeIncomingRole(r?: string | null): UIRole {
  if (!r) return "colaboradorproyecto";
  const low = r.toLowerCase();

  if ((UI_ROLES as string[]).includes(low)) return low as UIRole;
  if (low === "admin") return "admin";
  if (low === "colaboradorvisitacion") return "colaboradorvisitacion";

  // Si viene "colaborador" genérico, elige default:
  if (low === "colaborador" || low === "colaboradores") return "colaboradorproyecto";

  // Fallback al default
  return "colaboradorproyecto";
}

export default function AddCollaboratorModal({ open, mode, initial, onClose, onSaved }: Props) {
  const { save } = useCollaborators();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    fullName: false, email: false, identification: false, birthdate: false, phone: false, roles: false,
  });

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    identification: "",
    birthdate: "",
    phone: "+506",
    roles: ["colaboradorproyecto"],
  });

  const [country, setCountry] = useState<string | undefined>("CR");
  const [idType, setIdType] = useState<IdType>("cedula");

  useEffect(() => { if (open) { setOkMsg(null); setServerError(null); setSubmitted(false); } }, [open]);

  useEffect(() => {
    if (open && mode === "editar" && initial) {
      // Normaliza el/los roles entrantes
      const rawRoles: string[] =
        Array.isArray((initial as any).roles) && (initial as any).roles.length > 0
          ? (initial as any).roles
          : [(initial as any).role ?? (initial as any).rol ?? "colaboradorproyecto"];
      const normalizedRoles: UIRole[] = rawRoles
        .map((r) => normalizeIncomingRole(r))
        .filter((r, i, arr) => arr.indexOf(r) === i);
      setForm({
        fullName: initial.fullName ?? "",
        email: initial.email ?? "",
        identification: (initial as any).identification ?? (initial as any).cedula ?? "",
        birthdate: initial.birthdate ? initial.birthdate.split("T")[0] : "",
        phone: initial.phone ?? "+506",
        roles: normalizedRoles.length > 0 ? normalizedRoles : ["colaboradorproyecto"],
      });
    }
    if (open && mode === "crear") resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initial?.id]);

  const resetForm = () => {
    setForm({ fullName: "", email: "", identification: "", birthdate: "", phone: "+506", roles: ["colaboradorproyecto"] });
    setCountry("CR"); setIdType("cedula");
    setTouched({ fullName: false, email: false, identification: false, birthdate: false, phone: false, roles: false });
  };

  /* Validación */
  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {};
    const name = form.fullName.trim();
    if (name.length < LIMITS.fullName.min) e.fullName = `Mínimo ${LIMITS.fullName.min} caracteres`;
    else if (name.length > LIMITS.fullName.max) e.fullName = `Máximo ${LIMITS.fullName.max} caracteres`;

    const email = form.email.trim();
    if (!EMAIL_RE.test(email)) e.email = "Correo inválido";
    else if (email.length > LIMITS.email.max) e.email = `Máximo ${LIMITS.email.max} caracteres`;

    const cfg = ID_CONFIG[idType];
    const id = form.identification.trim();
    if (cfg.onlyNumbers && !/^\d+$/.test(id)) e.identification = "Solo números";
    else if (!cfg.pattern.test(id)) e.identification = "Formato inválido";
    else if (id.length < cfg.length[0] || id.length > cfg.length[1]) e.identification = `Debe tener entre ${cfg.length[0]} y ${cfg.length[1]}`;

    if (!form.birthdate) e.birthdate = "Requerido";

    const safeCountry = isSupportedCountry(country || "") ? (country as CountryCode) : "CR";
    const parsed = parsePhoneNumberFromString((form.phone || "").replace(/\s+/g, ""), safeCountry);
    if (!parsed || !parsed.isValid()) e.phone = `Teléfono inválido (${safeCountry.toUpperCase()})`;

    if (form.roles.length === 0) e.roles = "Selecciona al menos un rol";
    return e;
  }, [form, country, idType]);

  // ✅ No mostrar errores mientras guarda o tras éxito (okMsg), para evitar “flicker” visual
  const showError = (f: Field) => (submitted || touched[f]) && !!errors[f] && !loading && !okMsg;
  const markTouched = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  /* Teléfono helpers */
  function getMaxNationalLengthFor(c?: string): number | null {
    if (!c) return null;
    try { const ex = getExampleNumber(c as any, examples as any); if (ex?.nationalNumber) return String(ex.nationalNumber).length; } catch {}
    const fb: Record<string, number> = { CR:8, US:10, CA:10, MX:10, ES:9, AR:10, CL:9, CO:10, PE:9, BR:11, EC:9, PA:8, NI:8, HN:8, SV:8, GT:8, DO:10, PR:10 };
    return fb[c] ?? 15;
  }
  const maxNational = getMaxNationalLengthFor(country) ?? 15;

  function handlePhoneChange(value?: string) {
    const c = country || "CR";
    try {
      const cc = getCountryCallingCode(c as any);
      const digits = (value || "").replace(/\D/g, "");
      let nat = digits.slice(String(cc).length);
      if (nat.length > maxNational) nat = nat.slice(0, maxNational);
      setForm((p) => ({ ...p, phone: `+${cc}${nat}` }));
    } catch { setForm((p) => ({ ...p, phone: value ?? p.phone })); }
  }
  function handlePhoneCountryChange(c?: string) {
    const next = c || "CR";
    setCountry(next);
    try { const cc = getCountryCallingCode(next as any); setForm((p) => ({ ...p, phone: `+${cc}` })); }
    catch { setForm((p) => ({ ...p, phone: "" })); }
  }
  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key; if (!/^\d$/.test(key)) return;
    const input = e.currentTarget; const val = input.value ?? "";
    try {
      const cc = getCountryCallingCode((country as any) || "CR"); const ccLen = String(cc).length;
      const selStart = input.selectionStart ?? val.length; const selEnd = input.selectionEnd ?? val.length;
      const replacing = selStart !== selEnd; const digitsAll = val.replace(/\D/g, "");
      const natLen = Math.max(0, digitsAll.length - ccLen);
      if (natLen >= maxNational && !replacing) e.preventDefault();
    } catch {}
  }

  /* Submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null); setOkMsg(null);

    // Mostramos errores si los hay
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const basePayload = {
        nombreCompleto: form.fullName.trim(),
        correo: form.email.trim(),
        telefono: (form.phone || "").replace(/\s+/g, ""),
        rol: UI_TO_API_ROLE[form.roles[0]],               // rol primario (backward compat)
        roles: form.roles.map((r) => UI_TO_API_ROLE[r]),  // todos los roles
        cedula: form.identification.trim(),
        fechaNacimiento: form.birthdate || null,
      };

      if (mode === "editar" && initial?.id != null) {
        await save({ id: initial.id, ...basePayload });
        setOkMsg("✅ Cambios guardados.");
        onSaved?.("updated");
        setSubmitted(false);            // ✅ evita que aparezcan errores al cerrar
        onClose();                      // ✅ cerrar inmediato (sin timeout)
      } else {
        const tempPassword = genTempPassword(12);
        const result = await save({ ...basePayload, password: tempPassword } as any);

        const inviteToken: string | undefined = (result as any)?.inviteToken;
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
          (typeof window !== "undefined" ? window.location.origin : "");

        const inviteLink = inviteToken
          ? `${appUrl}/set-password?token=${encodeURIComponent(inviteToken)}`
          : null;

        setOkMsg(
          inviteLink
            ? `✅ Colaborador creado. Enlace para establecer contraseña: ${inviteLink}`
            : "✅ Colaborador creado. Se debe enviar el correo de invitación desde el backend."
        );

        onSaved?.("created");
        setSubmitted(false);            // ✅ evita flicker si el form se resetea
        resetForm();
        onClose();                      // ✅ cerrar inmediato (sin timeout)
      }
    } catch (err: any) {
      setServerError(err?.message || "❌ Operación no completada.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  const cfg = ID_CONFIG[idType];
  const title = mode === "editar" ? "Editar colaborador" : "Añadir colaborador";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-slate-500 hover:underline">Cerrar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, "")
                    .replace(/\s{2,}/g, " ");
                  setForm({ ...form, fullName: val.slice(0, LIMITS.fullName.max) });
                }}
                onBlur={() => markTouched("fullName")}
                placeholder="Nombre y apellidos"
                maxLength={LIMITS.fullName.max}
                aria-invalid={showError("fullName")}
                aria-describedby="fullName-error"
                required
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {form.fullName.length}/{LIMITS.fullName.max}
              </p>
              {showError("fullName") && <p id="fullName-error" className="text-xs text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email"
                     value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                     onBlur={() => markTouched("email")} placeholder="nombre@dominio.com"
                     maxLength={LIMITS.email.max} pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                     title="Ingresa un correo válido" aria-invalid={showError("email")} aria-describedby="email-error" required />
              {showError("email") && <p id="email-error" className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Tipo de identificación */}
            <div>
              <Label htmlFor="idType">Tipo de identificación</Label>
              <select id="idType" className="w-full rounded border px-3 py-2 h-10" value={idType}
                      onChange={(e) => { setIdType(e.target.value as IdType); setForm({ ...form, identification: "" }); }}>
                <option value="cedula">Cédula</option>
                <option value="dimex">DIMEX</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="nite">NITE</option>
                <option value="juridica">Cédula jurídica</option>
              </select>
            </div>

            {/* Identificación */}
            <div>
              <Label htmlFor="identification">{cfg.label} *</Label>
              <Input id="identification" value={form.identification}
                     onChange={(e) => { let val = e.target.value; if (cfg.onlyNumbers) val = val.replace(/\D/g, ""); setForm({ ...form, identification: val.slice(0, cfg.length[1]) }); }}
                     onBlur={() => markTouched("identification")} inputMode={cfg.onlyNumbers ? "numeric" : "text"}
                     placeholder={cfg.placeholder} maxLength={cfg.length[1]} aria-invalid={showError("identification")} aria-describedby="identification-error" required />
              {showError("identification") && <p id="identification-error" className="text-xs text-red-600 mt-1">{errors.identification}</p>}
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <Label htmlFor="birthdate">Fecha de nacimiento *</Label>
              <Input id="birthdate" type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                     onBlur={() => markTouched("birthdate")} aria-invalid={showError("birthdate")} aria-describedby="birthdate-error" required />
              {showError("birthdate") && <p id="birthdate-error" className="text-xs text-red-600 mt-1">{errors.birthdate}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <PhoneInput id="phone" international withCountryCallingCode countryCallingCodeEditable={false} defaultCountry="CR"
                          value={form.phone || undefined} onCountryChange={handlePhoneCountryChange} onChange={handlePhoneChange}
                          onBlur={() => markTouched("phone")} className="PhoneInput" aria-invalid={showError("phone")} aria-describedby="phone-error"
                          numberInputProps={{ inputMode: "tel", autoComplete: "tel", onKeyDown: handlePhoneKeyDown }} />
              {showError("phone") && <p id="phone-error" className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

          </div>

          {/* Roles (checkboxes multi-rol) — fuera del grid para span completo */}
          <div>
            <Label>
              Roles *{" "}
              <span className="font-normal text-xs text-slate-400">(selecciona uno o más)</span>
            </Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {UI_ROLES.map((r) => {
                const checked = form.roles.includes(r);
                // El rol principal es el primero en el orden de UI_ROLES que esté marcado
                const primaryRole = UI_ROLES.find((role) => form.roles.includes(role));
                const isPrimary = checked && r === primaryRole && form.roles.length > 1;
                return (
                  <label
                    key={r}
                    className={`flex items-center gap-2 cursor-pointer select-none rounded-lg border px-3 py-2 transition ${
                      checked
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        markTouched("roles");
                        setForm((f) => {
                          const next = e.target.checked
                            ? [...f.roles, r]
                            : f.roles.filter((x) => x !== r);
                          // Mantener orden de UI_ROLES para que el rol principal sea predecible
                          return { ...f, roles: UI_ROLES.filter((role) => next.includes(role)) };
                        });
                      }}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700 flex-1">{ROLE_LABEL[r]}</span>
                    {isPrimary && (
                      <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">
                        Principal
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {form.roles.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Rol principal:{" "}
                <strong>{ROLE_LABEL[UI_ROLES.find((r) => form.roles.includes(r))!]}</strong>
              </p>
            )}
            {showError("roles") && (
              <p className="text-xs text-red-600 mt-1">Selecciona al menos un rol</p>
            )}
          </div>

          {/* Mensajes del servidor */}
          {serverError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
          {submitted && okMsg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 break-words">{okMsg}</div>}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Guardando…" : (mode === "editar" ? "Guardar cambios" : "Crear")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
