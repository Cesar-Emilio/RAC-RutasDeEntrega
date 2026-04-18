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
    <div className="flex items-center gap-4 bg-surface rounded-2xl border border-border p-5 hover:border-border-subtle transition-colors">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconText}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
    </div>
  );
}