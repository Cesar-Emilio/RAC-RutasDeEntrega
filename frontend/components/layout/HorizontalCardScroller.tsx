import type { RefObject, ReactNode } from "react";

type HorizontalCardScrollerProps<T extends { id: string | number }> = {
  title: string;
  description: string;
  items: T[];
  isLoading?: boolean;
  hideHeader?: boolean;
  loadingText?: string;
  emptyText?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  scrollProgress: number;
  linkHref?: string;
  linkLabel?: string;
  renderCard: (item: T) => ReactNode;
};

export function HorizontalCardScroller<T extends { id: string | number }>({
  title,
  description,
  items,
  isLoading = false,
  hideHeader = false,
  loadingText = "Cargando...",
  emptyText = "No hay elementos registrados.",
  scrollRef,
  scrollProgress,
  linkHref,
  linkLabel,
  renderCard,
}: Readonly<HorizontalCardScrollerProps<T>>) {
  return (
    <section className="mb-10 min-w-0">
      {hideHeader ? null : (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
              {title}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {isLoading ? loadingText : description}
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
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.length > 0 ? (
          items.map((item) => renderCard(item))
        ) : (
          <div
            className="rounded-xl border border-dashed px-4 py-6 text-sm"
            style={{ minWidth: "100%", color: "var(--color-text-muted)" }}
          >
            {isLoading ? loadingText : emptyText}
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
