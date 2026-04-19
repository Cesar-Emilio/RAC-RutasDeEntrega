"use client";

import { sendCoordinates } from "@/lib/routes-api";
import { Loader2, Maximize2, Map } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const DeliveryMap = dynamic(
  () => import("./delivery-map").then((m) => m.DeliveryMap),
  { ssr: false }
);

interface RouteMapProps {
  readonly warehouseName: string;
  readonly details: any;
  readonly origin: any;
}

export function RouteMap({ warehouseName, details, origin }: RouteMapProps) {
  const [route, setRoute] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(true);

  const stops = useMemo(() => {
    const sorted = [...details].sort((a, b) => a.order_index - b.order_index);

    const originStop = origin
      ? [{ lat: Number(origin.latitude), lng: Number(origin.longitude), label: `🏭 ${origin.name ?? warehouseName}` }]
      : [];

    const deliveryStops = sorted.map((d) => ({
      lat: Number(d.delivery_point.latitude),
      lng: Number(d.delivery_point.longitude),
      label: d.delivery_point.address,
    }));

    return [...originStop, ...deliveryStops];
  }, [details, origin, warehouseName]);

  useEffect(() => {
    async function load() {
      try {
        setLoadingRoute(true);

        const coords: [number, number][] = stops.map((s) => [s.lng, s.lat]);

        const data = coords.length >= 2 ? await sendCoordinates(coords) : null;
        setRoute(data);
      } catch (err) {
        console.error("Error fetching route", err);
        setRoute(null);
      } finally {
        setLoadingRoute(false);
      }
    }

    load();
  }, [stops]);

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">Mapa de entrega</h3>
        <span className="text-sm text-text-secondary">
          Origen: {warehouseName}
        </span>
      </div>

      <div className="relative flex-1 min-h-75 lg:min-h-100 bg-background">
        <button
          onClick={() => console.log("Expand map")}
          className="absolute top-3 right-3 p-2 rounded-lg bg-surface border border-border hover:bg-border/50 transition-colors z-[1000]"
          aria-label="Expandir mapa"
        >
          <Maximize2 className="w-5 h-5 text-text-secondary" />
        </button>

        {loadingRoute ? (
          // Loader centrado manualmente
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary-400" />
            <p className="text-text-secondary text-sm font-medium">
              Cargando mapa de entrega
            </p>
          </div>
        ) : (
          // El mapa ocupa todo el espacio — sin wrapper flex
          <DeliveryMap
            geojson={route}
            stops={stops}
          />
        )}
      </div>
    </div>
  );
}