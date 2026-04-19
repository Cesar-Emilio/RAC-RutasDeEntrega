"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

type AlertType = "success" | "error" | "warning" | "info";

type Alert = {
  id: string;
  type: AlertType;
  message: string;
  exiting: boolean;
};

type AlertContextValue = {
  addAlert: (type: AlertType, message: string) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const ALERT_DURATION = 5000;
const EXIT_ANIMATION_DURATION = 350;

const alertConfig: Record<
  AlertType,
  {
    icon: typeof CheckCircle2;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    progressColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.30)",
    text: "var(--color-success)",
    iconColor: "var(--color-success)",
    progressColor: "var(--color-success)",
  },
  error: {
    icon: AlertCircle,
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.30)",
    text: "var(--color-error)",
    iconColor: "var(--color-error)",
    progressColor: "var(--color-error)",
  },
  warning: {
    icon: AlertTriangle,
    bg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.30)",
    text: "var(--color-warning)",
    iconColor: "var(--color-warning)",
    progressColor: "var(--color-warning)",
  },
  info: {
    icon: Info,
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.30)",
    text: "var(--color-info)",
    iconColor: "var(--color-info)",
    progressColor: "var(--color-info)",
  },
};

function AlertItem({
  alert,
  onDismiss,
}: {
  alert: Alert;
  onDismiss: (id: string) => void;
}) {
  const config = alertConfig[alert.type];
  const Icon = config.icon;
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      requestAnimationFrame(() => {
        if (progressRef.current) {
          progressRef.current.style.width = "0%";
        }
      });
    }
  }, []);

  return (
    <div
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        opacity: alert.exiting ? 0 : 1,
        transform: alert.exiting ? "translateX(100%)" : "translateX(0)",
        transition: `opacity ${EXIT_ANIMATION_DURATION}ms ease, transform ${EXIT_ANIMATION_DURATION}ms ease`,
      }}
      className="pointer-events-auto relative w-80 overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: config.iconColor }}
        />
        <p
          className="flex-1 text-sm font-medium leading-snug"
          style={{ color: "var(--color-text-primary)" }}
        >
          {alert.message}
        </p>
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-white/10 cursor-pointer"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>
      <div
        className="h-[2px] w-full"
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <div
          ref={progressRef}
          className="h-full"
          style={{
            width: "100%",
            backgroundColor: config.progressColor,
            transition: `width ${ALERT_DURATION}ms linear`,
          }}
        />
      </div>
    </div>
  );
}

export function AlertProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, exiting: true } : a))
    );
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, EXIT_ANIMATION_DURATION);
  }, []);

  const addAlert = useCallback(
    (type: AlertType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setAlerts((prev) => [...prev, { id, type, message, exiting: false }]);

      setTimeout(() => {
        dismissAlert(id);
      }, ALERT_DURATION);
    },
    [dismissAlert]
  );

  const value = useMemo(() => ({ addAlert }), [addAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-3">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} onDismiss={dismissAlert} />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}
