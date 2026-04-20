import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import { HorizontalCardScroller } from "./HorizontalCardScroller";

export type CompanyRouteCard = {
  id: string | number;
  packages: number;
  date: string;
  location: string;
  status: string;
  href?: string;
};

type CompanyRoutesCardsProps = {
  title: string;
  description: string;
  items: CompanyRouteCard[];
  isLoading?: boolean;
  hideHeader?: boolean;
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
  hideHeader = false,
  scrollRef,
  scrollProgress,
  linkHref,
  linkLabel,
}: Readonly<CompanyRoutesCardsProps>) {
  return (
    <HorizontalCardScroller
      title={title}
      description={description}
      items={items}
      isLoading={isLoading}
      hideHeader={hideHeader}
      loadingText="Cargando entregas..."
      emptyText="Aun no hay entregas registradas."
      scrollRef={scrollRef}
      scrollProgress={scrollProgress}
      linkHref={linkHref}
      linkLabel={linkLabel}
      renderCard={(route) => (
        <Link
          key={route.id}
          href={route.href ?? `/company/deliveries/${route.id}`}
          className="w-42 flex-none cursor-pointer rounded-xl border p-3 transition-all duration-200 hover:border-primary-500/50 md:w-44 md:p-4"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-divider)" }}
        >
          <div className="mb-3 flex items-start justify-between">
            <span
              className="rounded px-2 py-1 text-xs font-medium"
              style={{ backgroundColor: "var(--color-primary-500)", color: "var(--color-background)" }}
            >
              {route.status}
            </span>
            <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
          </div>

          <div className="mb-2 flex items-center gap-2">
            <Package size={16} style={{ color: "var(--color-primary-500)" }} />
            <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              {route.packages} paquetes
            </span>
          </div>

          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {route.date} | {route.location}
          </p>
        </Link>
      )}
    />
  );
}
