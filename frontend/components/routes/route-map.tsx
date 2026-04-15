"use client";

import { Maximize2, Map } from "lucide-react";

interface RouteMapPlaceholderProps {
  warehouseName: string;
}

export function RouteMapPlaceholder({ warehouseName }: RouteMapPlaceholderProps) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">Mapa de ruta</h3>
        <span className="text-sm text-text-secondary">
          Origen: {warehouseName}
        </span>
      </div>

      <div className="relative flex-1 min-h-[300px] lg:min-h-[400px] bg-background">
        <button
          onClick={() => console.log("Expand map")}
          className="absolute top-3 right-3 p-2 rounded-lg bg-surface border border-border hover:bg-border/50 transition-colors z-10"
          aria-label="Expandir mapa"
        >
          <Maximize2 className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-border/50 flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-text-light" />
          </div>
          <p className="text-text-secondary text-sm font-medium">
            Mapa de ruta
          </p>
          <p className="text-text-light text-xs mt-1">
            (próximamente)
          </p>
        </div>

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>
    </div>
  );
}
