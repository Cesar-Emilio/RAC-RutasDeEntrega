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
      return <CheckCircle2 size={18} style={{ color: "#22c55e" }} />;
    case "warning":
      return <AlertCircle size={18} style={{ color: "#E27D2A" }} />;
    default:
      return <ShieldCheck size={18} style={{ color: "#3b82f6" }} />;
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
      <h2 className="mb-1 text-base font-semibold md:text-lg" style={{ color: "#BBBDC0" }}>
        {title}
      </h2>
      <p className="mb-4 text-sm" style={{ color: "#6b7280" }}>
        {isLoading ? "Cargando actividad reciente..." : description}
      </p>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: "#161A20", borderColor: "#2a2f38" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-225 w-full">
            <thead>
              <tr style={{ backgroundColor: "#1a1f26" }}>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7280" }}
                >
                  Accion
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7280" }}
                >
                  Descripcion
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7280" }}
                >
                  Usuario
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7280" }}
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
                    className="border-t transition-colors hover:bg-[#1a1f26]"
                    style={{ borderColor: "#2a2f38" }}
                  >
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: "#0f1115" }}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <span
                          className="whitespace-nowrap text-sm font-medium"
                          style={{ color: "#BBBDC0" }}
                        >
                          {activity.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm" style={{ color: "#6b7280" }}>
                        {activity.description}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: "#E27D2A" }}
                        >
                          <User size={12} style={{ color: "#0f1115" }} />
                        </div>
                        <span
                          className="whitespace-nowrap text-sm"
                          style={{ color: "#BBBDC0" }}
                        >
                          {activity.user}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock size={12} style={{ color: "#6b7280" }} />
                        <span className="whitespace-nowrap text-sm" style={{ color: "#6b7280" }}>
                          {activity.time}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[#6b7280]"
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