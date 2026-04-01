"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "warning" | "danger" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { borderColor: string; iconColor: string; Icon: React.ElementType }
> = {
  success: {
    borderColor: "#10B981",
    iconColor: "text-[#10B981]",
    Icon: CheckCircle,
  },
  warning: {
    borderColor: "#F59E0B",
    iconColor: "text-[#F59E0B]",
    Icon: AlertTriangle,
  },
  danger: {
    borderColor: "#EF4444",
    iconColor: "text-[#EF4444]",
    Icon: XCircle,
  },
  info: {
    borderColor: "#0EA5E9",
    iconColor: "text-[#0EA5E9]",
    Icon: Info,
  },
};

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.Icon;
  const duration = toast.duration ?? 4000;

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "flex w-[360px] max-w-[calc(100vw-3rem)] items-start gap-3 overflow-hidden",
        "rounded-lg border border-[#E2E8F0] bg-white shadow-lg",
        "transition-all duration-200 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      ].join(" ")}
      style={{ borderLeftColor: config.borderColor, borderLeftWidth: 3 }}
    >
      <div className="flex flex-1 items-start gap-3 p-4">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F172A]">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-[13px] text-[#475569]">{toast.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Benachrichtigung schließen"
        className="mr-3 mt-3.5 shrink-0 rounded-md p-1 text-[#94A3B8] transition-colors hover:bg-[#F0F4F9] hover:text-[#475569]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Toast Context & Provider ────────────────────────────────────────────────

import { createContext, useContext } from "react";

interface ToastContextValue {
  addToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => {
      const next = [...prev, { ...toast, id }];
      // Max 3 at a time — remove oldest if over limit
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Portal-equivalent: fixed container bottom-right */}
      <div
        aria-label="Benachrichtigungen"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
