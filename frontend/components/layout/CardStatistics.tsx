import type { LucideIcon } from "lucide-react";

type CardStatisticsItem = {
  id: number;
  label: string;
  value: number;
  icon?: LucideIcon;
  accentClassName?: string;
};

type CardStatisticsProps = {
  title: string;
  description: string;
  items: CardStatisticsItem[];
  isLoading?: boolean;
};

export function CardStatistics({
  title,
  description,
  items,
  isLoading = false,
}: Readonly<CardStatisticsProps>) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border p-5 shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-divider)",
              }}
            >
              <div className="-mx-5 -mt-5 mb-4 h-1 w-[calc(100%+2.5rem)] rounded-t-2xl" style={{ backgroundColor: "var(--color-primary-500)" }} />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none" style={{ color: "var(--color-text-secondary)" }}>
                    {item.value}
                  </p>
                </div>

                {item.icon ? (
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "var(--color-divider)",
                    }}
                  >
                    <item.icon size={21} style={{ color: "var(--color-primary-500)" }} />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 h-px w-full" style={{ backgroundColor: "color-mix(in srgb, var(--color-divider) 60%, transparent)" }} />
            </div>
          ))
        ) : (
          Array.from({ length: 4 }, (_, placeholderNumber) => placeholderNumber + 1).map((placeholderNumber) => (
            <div
              key={`placeholder-${placeholderNumber}`}
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
            >
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded-full bg-white/10" />
              {isLoading ? null : (
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Sin datos disponibles
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}