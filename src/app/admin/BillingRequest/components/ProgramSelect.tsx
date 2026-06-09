// src/app/admin/BillingRequest/components/ProgramSelect.tsx
"use client";

import React from "react";
import type { ProgramOption } from "../types/billing.types";

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: ProgramOption[];
  allowManual?: boolean;
  /** NUEVO: placeholder opcional para select / input */
  placeholder?: string;
  className?: string;
};

export default function ProgramSelect({
  value,
  onChange,
  options,
  allowManual = false,
  placeholder,
  className,
}: Props) {
  const hasOptions = Array.isArray(options) && options.length > 0;

  if (!hasOptions && allowManual) {
    // Fallback manual cuando no hay opciones (o no cargaron)
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className ?? "w-full border rounded-md px-3 py-2"}
        placeholder={placeholder ?? "ID de programa"}
        inputMode="numeric"
      />
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "w-full border rounded-md px-3 py-2"}
    >
      {/* Opción de placeholder si no hay valor seleccionado */}
      {!value && (
        <option value="" disabled>
          {placeholder ?? "Selecciona un programa"}
        </option>
      )}

      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  );
}
