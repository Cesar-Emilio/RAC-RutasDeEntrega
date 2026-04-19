"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface DeliveryMapProps {
  geojson: any | null;
  singlePoint?: { lat: number; lng: number };
  stops: { lat: number; lng: number; label: string }[];
}

export function DeliveryMap({ geojson, stops }: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import("leaflet").then((L) => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current!);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      if (geojson) {
        const routeLayer = L.geoJSON(geojson, {
          style: { color: "#6366f1", weight: 4, opacity: 0.85 },
        }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
      }

      stops.forEach((stop, i) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:#6366f1;color:#fff;border-radius:50%;
            width:28px;height:28px;display:flex;align-items:center;
            justify-content:center;font-size:12px;font-weight:700;
            border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)
          ">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([stop.lat, stop.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>#${i + 1}</b><br>${stop.label}`);
      });
      
      if (!geojson && stops.length > 0) {
        const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [geojson, stops]);

  return <div ref={containerRef} className="absolute inset-0" />;
}