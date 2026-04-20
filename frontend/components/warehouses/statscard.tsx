import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  iconColor?: "orange" | "green";
}

export function StatsCard({ icon: Icon, value, label, iconColor = "orange" }: StatsCardProps) {
  const iconBg = iconColor === "orange" ? "bg-primary-500/15" : "bg-green-500/15";
  const iconText = iconColor === "orange" ? "text-primary-500" : "text-green-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface hover:border-border-subtle transition-colors">
      <div className="h-1 w-full bg-primary-500" />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconText}`} />
        </div>
        <div>
          <p className="text-xl font-bold leading-none text-text-primary">{value}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}