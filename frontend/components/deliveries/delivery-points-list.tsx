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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-medium text-primary">Puntos de entrega</h3>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
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
        <ul className="relative px-4 py-3 space-y-1">
          <div className="absolute left-8.5 top-6 bottom-6 w-px bg-border" />

          {orderedPoints.map((point, i) => {
            return (
              <li
                key={`${point.id}-${point.orderIndex}`}
                className="relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-border/40 transition-colors group"
              >
                <div className={`
                  relative z-10 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-colors
                  "bg-primary-500/20 text-primary-400 border border-primary-500/40 group-hover:bg-primary-500/30"
                `}>
                  {point.orderIndex + 1}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-primary leading-tight">
                    {point.receiver_name}
                  </p>

                  <div className="flex items-start gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted mt-0.5 shrink-0" />
                    <p className="text-xs text-secondary leading-relaxed">
                      {point.address}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted tabular-nums">
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