// src/app/admin/Billing/components/FileUpload.tsx
"use client";
import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/* ========= Tipos ========= */
type BaseProps = {
  accept?: string;
  maxSizeMB?: number;   // tamaño por archivo
  maxTotalMB?: number;  // suma total (solo aplica en múltiple)
  maxFiles?: number;    // cantidad máxima (solo aplica en múltiple)
};

type MultipleProps = BaseProps & {
  multiple: true;
  onChange: (files: File[]) => void;
};

type SingleProps = BaseProps & {
  multiple?: false;             // por defecto simple
  onChange: (file: File | null) => void;
};

type Props = MultipleProps | SingleProps;

/* ========= Constantes ========= */
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/* ========= Utils ========= */
const toKB = (bytes: number) => Math.round(bytes / 1024) + " KB";

export default function FileUpload({
  accept = "application/pdf,image/jpeg,image/png,image/webp",
  multiple = false,
  maxSizeMB = 25,
  maxTotalMB = 100,
  maxFiles = 10,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const totalSize = useMemo(
    () => files.reduce((s, f) => s + f.size, 0),
    [files]
  );

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const validateOne = (f: File): string | null => {
    if (!ALLOWED_MIME.has(f.type)) {
      return `Formato no permitido: ${f.name} (${f.type || "desconocido"})`;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `"${f.name}" supera ${maxSizeMB} MB`;
    }
    return null;
  };

  const pushValid = (incoming: File[]) => {
    if (!multiple) {
      const f = incoming[0];
      if (!f) return;
      const err = validateOne(f);
      if (err) {
        toast.error(err);
      } else {
        setFiles([f]);
        (onChange as SingleProps["onChange"])(f);
      }
      resetInput();
      return;
    }

    // múltiple
    const next: File[] = [...files];

    for (const f of incoming) {
      const err = validateOne(f);
      if (err) {
        toast.error(err);
        continue;
      }
      if (next.length + 1 > maxFiles) {
        toast.error(`Máximo ${maxFiles} archivos por solicitud`);
        break;
      }
      const nextTotal = next.reduce((s, x) => s + x.size, 0) + f.size;
      if (nextTotal > maxTotalMB * 1024 * 1024) {
        toast.error(`La suma total supera ${maxTotalMB} MB`);
        break;
      }
      const dup = next.some(
        (x) =>
          x.name === f.name &&
          x.size === f.size &&
          x.lastModified === f.lastModified
      );
      if (!dup) next.push(f);
    }

    setFiles(next);
    (onChange as MultipleProps["onChange"])(next);
    resetInput();
  };

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files ?? []);
    if (!arr.length) return;
    pushValid(arr);
  };

  const removeAt = (idx: number) => {
    if (!multiple) {
      setFiles([]);
      (onChange as SingleProps["onChange"])(null);
      resetInput();
      return;
    }
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    (onChange as MultipleProps["onChange"])(next);
  };

  const clear = () => {
    setFiles([]);
    if (multiple) {
      (onChange as MultipleProps["onChange"])([]);
    } else {
      (onChange as SingleProps["onChange"])(null);
    }
    resetInput();
  };

  return (
    <div className="space-y-2">
      {/* Ocultamos el texto nativo (filename) del input para que no muestre “No se eligió ningún archivo” */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handle}
        className="
          block w-full text-sm
          text-transparent
          file:mr-4 file:rounded-md file:border-0 file:bg-gray-100
          file:px-4 file:py-2 file:text-sm file:font-medium
          file:text-slate-700 hover:file:bg-gray-200
          focus:outline-none
        "
        aria-label="Elegir archivos"
      />

      {files.length > 0 && (
        <div className="rounded-md border p-2">
          <ul className="max-h-48 overflow-auto space-y-1 text-sm text-slate-700">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${f.lastModified}`}
                className="flex items-center justify-between"
              >
                <span className="truncate break-words">{f.name}</span>
                <div className="ml-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>{toKB(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    /* 🎨 Quitar (rose) */
                    className="rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Total: {toKB(totalSize)}</span>
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-rose-700 bg-rose-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Vaciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
