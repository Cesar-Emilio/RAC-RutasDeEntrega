import { MapPin, ShieldCheck } from "lucide-react";
import type { RefObject } from "react";
import type { DashboardWarehouse } from "@/lib/dashboard-api";
import { HorizontalCardScroller } from "./HorizontalCardScroller";

type WarehouseCardsProps = {
  title: string;
  description: string;
  items: DashboardWarehouse[];
  isLoading?: boolean;
  hideHeader?: boolean;
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
  hideHeader = false,
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
      hideHeader={hideHeader}
      loadingText="Cargando almacenes..."
      emptyText="Aun no hay almacenes registrados."
      scrollRef={scrollRef}
      scrollProgress={scrollProgress}
      linkHref={linkHref}
      linkLabel={linkLabel}
      renderCard={(warehouse) => (
        <div
          key={warehouse.id}
          className="group w-40 flex-none cursor-pointer overflow-hidden rounded-2xl border shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 md:w-44"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
        >
          <div className="h-1 w-full" style={{ backgroundColor: "var(--color-primary-500)" }} />

          <div className="flex flex-col items-center gap-4 px-4 py-5 md:px-5 md:py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--color-divider)" }}>
              <ShieldCheck size={22} style={{ color: "var(--color-primary-500)" }} />
            </div>

            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                Almacén
              </p>
              <h3 className="mt-2 text-sm font-semibold leading-tight tracking-[0.02em] md:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
                {warehouse.name}
              </h3>
            </div>

            <div className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center" style={{ borderColor: "var(--color-divider)" }}>
              <MapPin size={12} style={{ color: "var(--color-primary-500)" }} />
              <p className="text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>
                {warehouse.location}
              </p>
            </div>
          </div>
        </div>
      )}
    />
  );
}