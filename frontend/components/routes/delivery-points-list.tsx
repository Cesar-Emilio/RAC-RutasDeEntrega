"use client";

import { RouteDetail } from "@/types/routes-types";
import { Navigation } from "lucide-react";

interface DeliveryPointsListProps {
  readonly route: RouteDetail;
}

interface OrderedDeliveryPoint {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
}

export function DeliveryPointsList({ route }: DeliveryPointsListProps) {
  const orderedPoints: OrderedDeliveryPoint[] = (() => {
    if (route.solution && route.solution.details.length > 0) {
      const sortedDetails = [...route.solution.details].sort(
        (a, b) => a.order_index - b.order_index
      );

      // CAMBIO: delivery_point ya es un objeto completo (no un ID) — se usa directamente
      return sortedDetails.map((detail) => ({
        id: detail.delivery_point.id,
        address: detail.delivery_point.address,
        latitude: Number(detail.delivery_point.latitude),
        longitude: Number(detail.delivery_point.longitude),
        orderIndex: detail.order_index,
      }));
    } else {
      return route.delivery_points.map((point, index) => ({
        id: point.id,
        address: point.address,
        latitude: point.latitude,
        longitude: point.longitude,
        orderIndex: index + 1,
      }));
    }
  })();

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Navigation className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-medium text-text-primary">
          Puntos de entrega
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[450px]">
        <ul className="divide-y divide-border">
          {orderedPoints.map((point) => (
            <li
              key={`${point.id}-${point.orderIndex}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-border/30 transition-colors"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {point.orderIndex}
                </span>
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-text-primary">
                  {/* CAMBIO: se reemplaza el texto hardcodeado de prueba "El sebas" */}
                  Parada {point.orderIndex}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {point.address}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
