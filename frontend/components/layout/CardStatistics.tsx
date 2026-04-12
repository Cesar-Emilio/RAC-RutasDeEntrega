type CardStatisticsItem = {
  id: number;
  label: string;
  value: number;
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
}: CardStatisticsProps) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-base font-semibold md:text-lg" style={{ color: "#BBBDC0" }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#161A20", borderColor: "#2a2f38" }}
            >
              <p className="text-xs uppercase tracking-wide" style={{ color: "#6b7280" }}>
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "#BBBDC0" }}>
                {item.value}
              </p>
            </div>
          ))
        ) : (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#161A20", borderColor: "#2a2f38" }}
            >
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded-full bg-white/10" />
              {isLoading ? null : (
                <p className="mt-2 text-xs text-[#6b7280]">Sin datos disponibles</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}