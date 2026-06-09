// src/hooks/use-toast.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

type ToastItem = { title: string; description?: string };

const ToastCtx = createContext<{ toast: (t: ToastItem) => void } | null>(null);

export function ToastProviderCustom({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);

  const toast = (t: ToastItem) => {
    setQueue((q) => [...q, t]);
    setTimeout(() => setQueue((q) => q.slice(1)), 3000); // se oculta a los 3s
  };

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[1000] space-y-2">
        {queue.map((t, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
            <div className="font-semibold text-slate-900">{t.title}</div>
            {t.description && <div className="text-sm text-slate-600">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProviderCustom>");
  return ctx;
}
