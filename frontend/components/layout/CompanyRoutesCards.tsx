import { ChevronRight, Package } from "lucide-react";
import type { RefObject } from "react";

export type CompanyRouteCard = {
  id: string | number;
  packages: number;
  date: string;
  location: string;
  status: string;
};

type CompanyRoutesCardsProps = {
  title: string;
  description: string;
  items: CompanyRouteCard[];
  isLoading?: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  scrollProgress: number;
  linkHref?: string;
  linkLabel?: string;
};

export function CompanyRoutesCards({
  title,
  description,
  items,
  isLoading = false,
  scrollRef,
  scrollProgress,
  linkHref,
  linkLabel,
}: CompanyRoutesCardsProps) {
  return (
    <section className="mb-10 min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold md:text-lg" style={{ color: "#BBBDC0" }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            {isLoading ? "Cargando rutas..." : description}
          </p>
        </div>

        {linkHref && linkLabel ? (
          <a
            href={linkHref}
            className="shrink-0 text-sm font-medium hover:underline"
            style={{ color: "#E27D2A" }}
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
          items.map((route) => (
            <div
              key={route.id}
              className="w-42 flex-none cursor-pointer rounded-xl border p-3 transition-all duration-200 hover:border-[#E27D2A]/50 md:w-44 md:p-4"
              style={{ backgroundColor: "#161A20", borderColor: "#2a2f38" }}
            >
              <div className="mb-3 flex items-start justify-between">
                <span
                  className="rounded px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: "#E27D2A", color: "#0f1115" }}
                >
                  {route.status}
                </span>
                <ChevronRight size={14} style={{ color: "#6b7280" }} />
              </div>

              <div className="mb-2 flex items-center gap-2">
                <Package size={16} style={{ color: "#E27D2A" }} />
                <span className="font-semibold" style={{ color: "#BBBDC0" }}>
                  {route.packages} paquetes
                </span>
              </div>

              <p className="text-xs" style={{ color: "#6b7280" }}>
                {route.date} | {route.location}
              </p>
            </div>
          ))
        ) : (
          <div
            className="rounded-xl border border-dashed px-4 py-6 text-sm text-[#6b7280]"
            style={{ minWidth: "100%" }}
          >
            {isLoading ? "Cargando rutas..." : "Aun no hay rutas registradas."}
          </div>
        )}
      </div>

      <div className="relative mt-3 h-1 w-full rounded-full" style={{ backgroundColor: "#2a2f38" }}>
        <div
          className="absolute left-0 h-full rounded-full transition-all duration-150"
          style={{
            backgroundColor: "#E27D2A",
            width: "30%",
            left: `${scrollProgress * 0.7}%`,
          }}
        />
      </div>
    </section>
  );
}
