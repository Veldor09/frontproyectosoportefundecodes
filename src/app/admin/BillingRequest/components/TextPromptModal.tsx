"use client";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  minLen?: number;          // mínimo permitido (se valida al enviar)
  maxLen?: number;          // máximo permitido (bloquea escritura)
  submitText?: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
};

export default function TextPromptModal({
  open,
  title,
  label,
  placeholder = "",
  minLen = 0,
  maxLen = Infinity,
  submitText = "Confirmar",
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  // Límite duro para el textarea (solo si es finito)
  const hardMax: number | undefined =
    Number.isFinite(maxLen) ? Math.floor(maxLen as number) : undefined;

  const lenTrim = value.trim().length;
  const tooShort = lenTrim < minLen;
  const tooLong = lenTrim > (Number.isFinite(maxLen) ? (maxLen as number) : Infinity);
  const showError = touched && (tooShort || tooLong);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let next = e.target.value;
    // Por si pegan un texto más largo que el máximo, recortamos manualmente
    if (typeof hardMax === "number" && next.length > hardMax) {
      next = next.slice(0, hardMax);
    }
    setValue(next);
  };

  const handleConfirm = () => {
    // Validación al enviar (mínimo y máximo sobre string "trimmed")
    if (tooShort || tooLong) {
      setTouched(true);
      return;
    }
    onSubmit(value.trim());
    setValue("");
    setTouched(false);
  };

  useEffect(() => {
    if (!open) {
      setValue("");
      setTouched(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-3 text-lg font-semibold text-slate-800">{title}</h3>

        <label className="block text-sm text-slate-600 mb-1">{label}</label>
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleConfirm();
            }
          }}
          rows={4}
          placeholder={placeholder}
          // Bloqueo nativo de longitud
          maxLength={hardMax}
          className="w-full resize-y rounded-md border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />

        {showError && (
          <p className="mt-2 text-xs text-red-600">
            {tooShort
              ? `Debe tener al menos ${minLen} caracteres.`
              : `No puede superar ${maxLen} caracteres.`}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}
