import { MapPin, ShieldCheck } from "lucide-react";
import type { RefObject } from "react";
import type { DashboardWarehouse } from "@/lib/dashboard-api";
import { HorizontalCardScroller } from "./HorizontalCardScroller";

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
}: Readonly<WarehouseCardsProps>) {
  return (
    <HorizontalCardScroller
      title={title}
      description={description}
      items={items}
      isLoading={isLoading}
      loadingText="Cargando almacenes..."
      emptyText="Aun no hay almacenes registrados."
      scrollRef={scrollRef}
      scrollProgress={scrollProgress}
      linkHref={linkHref}
      linkLabel={linkLabel}
      renderCard={(warehouse) => (
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
      )}
    />
  );
}