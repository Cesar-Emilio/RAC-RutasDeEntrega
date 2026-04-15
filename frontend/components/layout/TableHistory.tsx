import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";
import type { DashboardActivity } from "@/lib/dashboard-api";

type TableHistoryProps = {
  title: string;
  description: string;
  items: DashboardActivity[];
  isLoading?: boolean;
};

function getActivityIcon(type: DashboardActivity["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />;
    case "warning":
      return <AlertCircle size={18} style={{ color: "var(--color-primary-500)" }} />;
    default:
      return <ShieldCheck size={18} style={{ color: "var(--color-info)" }} />;
  }
}

export function TableHistory({
  title,
  description,
  items,
  isLoading = false,
}: TableHistoryProps) {
  return (
    <section className="min-w-0">
      <h2 className="mb-1 text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </h2>
      <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {isLoading ? "Cargando actividad reciente..." : description}
      </p>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-225 w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Accion
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Descripcion
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Usuario
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Tiempo
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-t transition-colors hover:bg-[var(--color-surface)]"
                    style={{ borderColor: "var(--color-divider)" }}
                  >
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: "var(--color-background)" }}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <span
                          className="whitespace-nowrap text-sm font-medium"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {activity.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {activity.description}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: "var(--color-primary-500)" }}
                        >
                          <User size={12} style={{ color: "var(--color-background)" }} />
                        </div>
                        <span
                          className="whitespace-nowrap text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {activity.user}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock size={12} style={{ color: "var(--color-text-muted)" }} />
                        <span className="whitespace-nowrap text-sm" style={{ color: "var(--color-text-muted)" }}>
                          {activity.time}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]"
                    colSpan={4}
                  >
                    {isLoading ? "Cargando actividad..." : "Aun no hay actividad reciente."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}