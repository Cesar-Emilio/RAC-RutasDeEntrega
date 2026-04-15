"use client";

import { ContentShell } from "@/components/layout/ContentShell";
import { DeliveryPointsList } from "@/components/routes/delivery-points-list";
import { RouteMapPlaceholder } from "@/components/routes/route-map";
import { RouteMetrics } from "@/components/routes/route-metrics";
import { RouteStatusAlert } from "@/components/routes/route-status-alert";
import { getRouteByIdRequest } from "@/lib/routes-api";
import { RouteDetail } from "@/types/routes-types";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function CreateRoutePage() {
    const params = useParams();
    const id = params.id as string;
    
    const [route, setRoute] = useState<RouteDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    if (!id) return;

    const fetchRoute = async () => {
        try {
        setLoading(true);
        setError(null);

        const data = await getRouteByIdRequest(id);

        setRoute(data);
        } catch (err: any) {
        setError(err?.message || "Error loading route");
        } finally {
        setLoading(false);
        }
    };

    fetchRoute();
    }, [id]);

    if (!route) {
      //TODO: Hacer un buen loader (orlando)
        return <div>Loading...</div>;
    }

  const formattedDate = formatDate(route.created_at);
  return (
    <ContentShell
      role="company"
      title="Historial de rutas"
      breadcrumbs={["Empresa", "Rutas"]}
    >
        <div className="flex-1 overflow-y-auto">
            
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Ruta {route.id}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Calculada el {formattedDate} desde {route.warehouse_name}, CDMX
            </p>
          </div>

          <RouteStatusAlert status={route.status} />

          <RouteMetrics route={route} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RouteMapPlaceholder warehouseName={route.warehouse_name} />
            </div>

            <div className="lg:col-span-1">
              <DeliveryPointsList route={route} />
            </div>
          </div>
        </div>
    </ContentShell>
  );
}
