import { MapPin, ShieldCheck } from "lucide-react";
import type { RefObject } from "react";
import type { DashboardWarehouse } from "@/lib/dashboard-api";

type WarehouseCardsProps = {
  title: string;
  description: string;
  items: DashboardWarehouse[];
  isLoading?: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  scrollProgress: number;
  linkHref?: string;
  linkLabel?: string;
};

export function WarehouseCards({
  title,
  description,
  items,
  isLoading = false,
  scrollRef,
  scrollProgress,
  linkHref,
  linkLabel,
}: WarehouseCardsProps) {
  return (
    <section className="mb-10 min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {isLoading ? "Cargando almacenes..." : description}
          </p>
        </div>

        {linkHref && linkLabel ? (
          <a
            href={linkHref}
            className="shrink-0 text-sm font-medium hover:underline"
            style={{ color: "var(--color-primary-500)" }}
          >
            {linkLabel}
          </a>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.length > 0 ? (
          items.map((warehouse) => (
            <div
              key={warehouse.id}
              className="w-34 flex-none cursor-pointer rounded-xl border p-3 transition-all duration-200 hover:border-[var(--color-primary-500)]/50 md:w-37 md:p-4"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
            >
              <div className="mb-3 flex justify-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg md:h-14 md:w-14"
                  style={{ backgroundColor: "var(--color-surface)" }}
                >
                  <ShieldCheck size={24} style={{ color: "var(--color-primary-500)" }} />
                </div>
              </div>
              <h3 className="mb-1 text-center text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                {warehouse.name}
              </h3>
              <p className="flex items-center justify-center gap-1 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                <MapPin size={12} style={{ color: "var(--color-primary-500)" }} />
                {warehouse.location}
              </p>
            </div>
          ))
        ) : (
          <div
            className="rounded-xl border border-dashed px-4 py-6 text-sm text-[var(--color-text-muted)]"
            style={{ minWidth: "100%" }}
          >
            {isLoading ? "Cargando almacenes..." : "Aun no hay almacenes registrados."}
          </div>
        )}
      </div>

      <div className="relative mt-3 h-1 w-full rounded-full" style={{ backgroundColor: "var(--color-divider)" }}>
        <div
          className="absolute left-0 h-full rounded-full transition-all duration-150"
          style={{
            backgroundColor: "var(--color-primary-500)",
            width: "30%",
            left: `${scrollProgress * 0.7}%`,
          }}
        />
      </div>
    </section>
  );
}