import type { LucideIcon } from "lucide-react";

type CardStatisticsItem = {
  id: number;
  label: string;
  value: number;
  icon?: LucideIcon;
  accentColor?: "orange" | "green";
};

type CardStatisticsProps = {
  title: string;
  description: string;
  items: CardStatisticsItem[];
  isLoading?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
};

export function CardStatistics({
  title,
  description,
  items,
  isLoading = false,
  compact = false,
  hideHeader = false,
}: Readonly<CardStatisticsProps>) {
  return (
    <section className={hideHeader ? "mb-0" : "mb-8"}>
      {!hideHeader ? (
        <div className="mb-4">
          <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {description}
          </p>
        </div>
      ) : null}

      <div className={compact ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className={`group w-full overflow-hidden rounded-2xl border shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 ${compact ? "p-0" : "p-5"}`}
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-divider)",
              }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: "var(--color-primary-500)" }} />

              {compact ? (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {item.icon ? (
                    <div
                      className={`p-2.5 rounded-xl ${item.accentColor === "green" ? "bg-green-500/15" : "bg-primary-500/15"}`}
                      style={{
                        backgroundColor: item.accentColor === "green"
                          ? "color-mix(in srgb, var(--color-green-400) 16%, transparent)"
                          : "color-mix(in srgb, var(--color-primary-500) 16%, transparent)",
                        borderColor: "transparent",
                      }}
                    >
                      <item.icon size={20} style={{ color: item.accentColor === "green" ? "var(--color-green-400)" : "var(--color-primary-500)" }} />
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold leading-none text-text-primary">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {item.label}
                    </p>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
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