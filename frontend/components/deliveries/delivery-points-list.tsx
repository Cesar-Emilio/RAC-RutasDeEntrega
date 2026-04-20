"use client";

import { RouteDetail } from "@/types/routes-types";
import { MapPin, Navigation, Package } from "lucide-react";

interface DeliveryPointsListProps {
  readonly route: RouteDetail;
}

interface OrderedDeliveryPoint {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  receiver_name: string;
  package_quantity: number;
  orderIndex: number;
}

export function DeliveryPointsList({ route }: DeliveryPointsListProps) {
  const orderedPoints: OrderedDeliveryPoint[] = (() => {
    const safeDetails = route.solution && Array.isArray(route.solution.details)
      ? route.solution.details
      : [];

    if (safeDetails.length > 0) {
      return [...safeDetails]
        .sort((a, b) => a.order_index - b.order_index)
        .map((detail) => ({
          id: detail.delivery_point.id,
          address: detail.delivery_point.address,
          latitude: Number(detail.delivery_point.latitude),
          longitude: Number(detail.delivery_point.longitude),
          receiver_name: detail.delivery_point.receiver_name,
          package_quantity: detail.delivery_point.package_quantity,
          orderIndex: detail.order_index,
        }));
    }
    return route.delivery_points.map((point, index) => ({
      id: point.id,
      address: point.address,
      latitude: point.latitude,
      longitude: point.longitude,
      receiver_name: point.receiver_name,
      package_quantity: point.package_quantity,
      orderIndex: index + 1,
    }));
  })();

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-primary-400" />
          <h3 className="text-sm font-medium text-primary">Puntos de entrega</h3>
        </div>
        <span className="rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-400">
          {orderedPoints.length} {orderedPoints.length === 1 ? "parada" : "paradas"}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto max-h-100 lg:max-h-112.5
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-divider
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-primary-500/40"
      >
        <ul className="relative space-y-1 px-3 py-2.5">
          <div className="absolute bottom-5 left-7.5 top-5 w-px bg-border" />

          {orderedPoints.map((point, i) => {
            return (
              <li
                key={`${point.id}-${point.orderIndex}`}
                className="group relative flex items-start gap-2.5 rounded-lg p-2 hover:bg-border/40 transition-colors"
              >
                <div className={`
                  relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                  transition-colors
                  "bg-primary-500/20 text-primary-400 border border-primary-500/40 group-hover:bg-primary-500/30"
                `}>
                  {point.orderIndex + 1}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-medium leading-tight text-primary">
                    {point.receiver_name}
                  </p>

                  <div className="mt-1 flex items-start gap-1">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                    <p className="text-[11px] leading-relaxed text-secondary">
                      {point.address}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-muted tabular-nums">
                    {point.package_quantity} paquetes
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}