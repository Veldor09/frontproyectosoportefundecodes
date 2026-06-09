"use client";

/**
 * ConfirmModal — reemplaza window.confirm() con un modal estilizado.
 *
 * Uso:
 *   const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
 *
 *   // Para abrir:
 *   setConfirmState({
 *     title: "Dar de baja proyecto",
 *     message: "¿Seguro que deseas dar de baja este proyecto?",
 *     onConfirm: () => handleRemove(id),
 *   });
 *
 *   // En el JSX:
 *   <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
 */

export type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
};

type Props = {
  state: ConfirmState | null;
  onClose: () => void;
};

export default function ConfirmModal({ state, onClose }: Props) {
  if (!state) return null;

  const { title, message, confirmLabel = "Confirmar", variant = "danger", onConfirm } = state;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
      : variant === "warning"
      ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";

  const iconColor =
    variant === "danger" ? "text-red-500" : variant === "warning" ? "text-amber-500" : "text-blue-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      aria-modal="true"
      role="alertdialog"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 flex flex-col gap-4">
        {/* Icono + título */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 shrink-0 ${iconColor}`}>
            {variant === "danger" ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ) : variant === "warning" ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
