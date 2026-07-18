import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const typeMap = {
  success: {
    icon: CheckCircle2,
    classes: 'border-green-100 bg-green-50 text-green-800',
  },
  error: {
    icon: AlertCircle,
    classes: 'border-red-100 bg-red-50 text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-amber-100 bg-amber-50 text-amber-800',
  },
  info: {
    icon: Info,
    classes: 'border-primary-100 bg-primary-50 text-primary-700',
  },
};

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const config = typeMap[toast.type] || typeMap.info;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-[fadeIn_0.2s_ease] rounded-2xl border p-4 shadow-card ${config.classes}`}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button type="button" onClick={() => onDismiss(toast.id)} className="rounded-full p-1 hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
