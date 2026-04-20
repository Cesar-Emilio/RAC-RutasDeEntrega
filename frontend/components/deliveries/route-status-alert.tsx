"use client";

import { AlertCircle, Clock, Loader2 } from "lucide-react";

type RouteStatus = "pending" | "processing" | "completed" | "error";

interface RouteStatusAlertProps {
  readonly status: RouteStatus;
}

const statusConfig: Record<
  RouteStatus,
  {
    icon: React.ElementType;
    message: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  } | null
> = {
  pending: {
    icon: Clock,
    message: "La entrega está pendiente de procesamiento",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    iconColor: "text-blue-400",
  },
  processing: {
    icon: Loader2,
    message: "La entrega se está procesando...",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-400",
    iconColor: "text-yellow-400",
  },
  completed: null,
  error: {
    icon: AlertCircle,
    message: "Hubo un error al procesar esta entrega",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    iconColor: "text-red-400",
  },
};

export function RouteStatusAlert({ status }: RouteStatusAlertProps) {
  const config = statusConfig[status];

  if (!config) return null;

  const Icon = config.icon;
  const isProcessing = status === "processing";

  return (
    <div
      className={`
        mb-4 flex items-center gap-2.5 rounded-lg border px-3 py-2.5
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <Icon
        className={`h-4 w-4 ${config.iconColor} ${isProcessing ? "animate-spin" : ""}`}
      />
      <span className={`text-xs font-medium sm:text-sm ${config.textColor}`}>
        {config.message}
      </span>
    </div>
  );
}
