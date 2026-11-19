"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

const EXIT_MS = 240;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [leaving, setLeaving] = useState<Record<string, boolean>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    setLeaving((prev) => ({ ...prev, [id]: true }));
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setLeaving((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      delete timers.current[id];
    }, EXIT_MS);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    timers.current[id] = setTimeout(() => remove(id), 3400);
  }, [remove]);

  const dismiss = useCallback((id: string) => {
    if (leaving[id] || timers.current[id]) return;
    remove(id);
  }, [leaving, remove]);

  const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle };
  const STYLES = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error:   "border-red-500/40     bg-red-500/10     text-red-300",
    warning: "border-yellow-500/40  bg-yellow-500/10  text-yellow-300",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed top-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col items-center gap-2 sm:top-5">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${STYLES[toast.type]} ${leaving[toast.id] ? "toast-drop-out" : "toast-drop-in"}`}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</span>
              <button onClick={() => dismiss(toast.id)} aria-label="إغلاق التنبيه" className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
