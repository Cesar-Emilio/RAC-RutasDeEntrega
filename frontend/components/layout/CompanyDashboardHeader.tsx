import { User } from "lucide-react";

type CompanyDashboardHeaderProps = {
  title?: string;
  description?: string;
};

export function CompanyDashboardHeader({
  title = "Dashboard",
  description = "Panel de administracion de la empresa",
}: CompanyDashboardHeaderProps) {
  return (
    <div className="shrink-0 px-4 py-4 md:px-6 md:py-5" style={{ backgroundColor: "#161A20" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl" style={{ color: "#BBBDC0" }}>
            {title}
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            {description}
          </p>
        </div>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border-2"
          style={{ borderColor: "#E27D2A", backgroundColor: "#1a1f26" }}
        >
          <User size={20} style={{ color: "#E27D2A" }} />
        </div>
      </div>
    </div>
  );
}
