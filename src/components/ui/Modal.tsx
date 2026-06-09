"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
   <div
  className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
  onClick={(e) => e.stopPropagation()}
>
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b shrink-0">
            <h2 className="text-xl font-bold text-[#1e3a8a]">{title}</h2>
          </div>
        )}

        {/* Body: scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
}