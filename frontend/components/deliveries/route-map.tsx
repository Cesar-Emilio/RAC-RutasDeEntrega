"use client";

import { sendCoordinates } from "@/lib/routes-api";
import { Loader2, Maximize2, Map, Minimize2 } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  console.log("DETAILS:", details);
  const stops = useMemo(() => {
    const safeDetails = Array.isArray(details) ? details : [];
    const sorted = [...safeDetails].sort((a, b) => a.order_index - b.order_index);

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

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const mapContent = (fullscreen: boolean) => (
    <div className={`relative bg-background ${fullscreen ? "w-full h-full" : "absolute inset-0"}`}>
      <button
        onClick={() => setIsFullscreen(!fullscreen)}
        className="absolute right-2 top-2 z-1000 cursor-pointer rounded-lg border border-border bg-surface p-1.5 transition-colors hover:bg-border/50"
        aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {fullscreen
          ? <Minimize2 className="h-4 w-4 text-text-secondary" />
          : <Maximize2 className="h-4 w-4 text-text-secondary" />
        }
      </button>

      {loadingRoute ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
          <p className="text-sm font-medium text-text-secondary">
            Cargando mapa de entrega
          </p>
        </div>
      ) : (
        <DeliveryMap geojson={route} stops={stops} invalidateKey={fullscreen} />
      )}
    </div>
  );

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-9998 flex flex-col bg-background pointer-events-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0 pointer-events-auto">
            <h3 className="text-sm font-medium text-text-primary">Mapa de entrega</h3>
            <span className="text-sm text-text-secondary">Origen: {warehouseName}</span>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden h-full flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <h3 className="text-sm font-medium text-text-primary">Mapa de entrega</h3>
          <span className="text-xs text-text-secondary">Origen: {warehouseName}</span>
        </div>

        <div
          className={
            isFullscreen
              ? "fixed inset-0 z-9999 mt-12.25 bg-background"
              : "relative flex-1 min-h-64 lg:min-h-80 bg-background"
          }
        >
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="absolute right-2 top-2 z-1000 cursor-pointer rounded-lg border border-border bg-surface p-1.5 transition-colors hover:bg-border/50"
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen
              ? <Minimize2 className="h-4 w-4 text-text-secondary" />
              : <Maximize2 className="h-4 w-4 text-text-secondary" />
            }
          </button>

          {loadingRoute ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
              <p className="text-sm font-medium text-text-secondary">
                Cargando mapa de entrega
              </p>
            </div>
          ) : (
            <DeliveryMap
              geojson={route}
              stops={stops}
              invalidateKey={isFullscreen}
            />
          )}
        </div>
      </div>
    </>
  );
}