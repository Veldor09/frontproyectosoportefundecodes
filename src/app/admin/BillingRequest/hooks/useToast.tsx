"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

/* Tipos */
type ToastType = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number; // ms (default 3500)
};

type ToastContextValue = {
  push: (t: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
};

/* Contexto */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/* Provider + viewport */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)) as string;

      const duration = t.duration ?? 3500;
      setToasts((prev) => [...prev, { id, ...t }]);
      if (duration > 0) {
        window.setTimeout(() => remove(id), duration);
      }
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Viewport */}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* Tarjeta visual */
function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const skin: Record<
    ToastType,
    { border: string; icon: React.ReactNode; title: string }
  > = {
    success: {
      border: "border-emerald-300",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      title: "Listo",
    },
    error: {
      border: "border-red-300",
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      title: "Error",
    },
    info: {
      border: "border-blue-300",
      icon: <Info className="h-4 w-4 text-blue-600" />,
      title: "Info",
    },
    warning: {
      border: "border-amber-300",
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      title: "Atención",
    },
  };

  const palette = skin[item.type];

  return (
    <div className={`pointer-events-auto w-full rounded-xl border bg-white p-3 shadow-lg ${palette.border}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{palette.icon}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800">
            {item.title ?? palette.title}
          </div>
          <div className="text-sm text-slate-700">{item.message}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* Hook de uso */
export function useToast() {
  const ctx = useContext(ToastContext);

  // Fallback si olvidaste montar el provider (no usa alert)
  if (!ctx) {
    return {
      success: (msg: string) => console.log("[toast:success]", msg),
      error: (msg: string) => console.error("[toast:error]", msg),
      info: (msg: string) => console.info("[toast:info]", msg),
      warn: (msg: string) => console.warn("[toast:warn]", msg),
    };
  }

  const { push } = ctx;

  return {
    success: (message: string, title?: string, duration?: number) =>
      push({ type: "success", message, title, duration }),
    error: (message: string, title?: string, duration?: number) =>
      push({ type: "error", message, title, duration }),
    info: (message: string, title?: string, duration?: number) =>
      push({ type: "info", message, title, duration }),
    warn: (message: string, title?: string, duration?: number) =>
      push({ type: "warning", message, title, duration }),
  };
}
