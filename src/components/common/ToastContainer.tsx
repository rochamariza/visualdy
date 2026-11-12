import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useStudy();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notificações"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const bgClass =
          toast.tone === 'error'
            ? 'bg-red-950 border-red-800 text-red-50'
            : toast.tone === 'info'
              ? 'bg-slate-900 border-slate-700 text-slate-50'
              : 'bg-emerald-950 border-emerald-800 text-emerald-50';

        const Icon =
          toast.tone === 'error'
            ? AlertCircle
            : toast.tone === 'info'
              ? Info
              : CheckCircle2;

        return (
          <div
            key={toast.id}
            role="status"
            data-testid="study-toast"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium transition-all ${bgClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fechar notificação"
              className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
