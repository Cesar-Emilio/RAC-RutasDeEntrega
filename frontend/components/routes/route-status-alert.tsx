"use client";

import { AlertCircle, Clock, Loader2, CheckCircle } from "lucide-react";

type RouteStatus = "pending" | "processing" | "completed" | "error";

interface RouteStatusAlertProps {
  status: RouteStatus;
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
    message: "La ruta está pendiente de procesamiento",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    iconColor: "text-blue-400",
  },
  processing: {
    icon: Loader2,
    message: "La ruta se está procesando...",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-400",
    iconColor: "text-yellow-400",
  },
  completed: null, // No alert for completed status
  error: {
    icon: AlertCircle,
    message: "Hubo un error al procesar esta ruta",
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
        flex items-center gap-3 px-4 py-3 rounded-lg border
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <Icon
        className={`w-5 h-5 ${config.iconColor} ${isProcessing ? "animate-spin" : ""}`}
      />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.message}
      </span>
    </div>
  );
}
