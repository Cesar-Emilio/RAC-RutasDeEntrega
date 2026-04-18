"use client";

import { ContentShell } from "@/components/layout/ContentShell";
import { DeliveryPointsList } from "@/components/deliveries/delivery-points-list";
import { RouteMap } from "@/components/deliveries/route-map";
import { RouteMetrics } from "@/components/deliveries/route-metrics";
import { RouteStatusAlert } from "@/components/deliveries/route-status-alert";
import { getRouteByIdRequest } from "@/lib/routes-api";
import { RouteDetail } from "@/types/routes-types";
import { useParams } from "next/navigation";
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
        console.log(data);

        setRoute(data);
        } catch (err: unknown) {
          console.log(err)
          const message = err instanceof Error ? err.message : "Error loading route";
          setError(message);
        } finally {
        setLoading(false);
        }
    };

    fetchRoute();
    }, [id]);

    if (loading) {
      return (
        <ContentShell
          role="company"
          title="Historial de entregas"
          breadcrumbs={["Empresa", "Entrega"]}
          isLoading
          loadingTitle="Cargando entrega..."
          loadingMessage="Estamos trayendo la informacion de la ruta de entrega seleccionada."
        />
      );
    }

    if (error || !route) {
      return (
        <ContentShell
          role="company"
          title="Historial de entregas"
          breadcrumbs={["Empresa", "Entrega"]}
        >
          <div className="rounded-2xl border border-error/40 bg-error/10 px-5 py-4 text-sm text-secondary">
            {error || "No se pudo cargar la entrega seleccionada."}
          </div>
        </ContentShell>
      );
    }

  const formattedDate = formatDate(route.created_at);
  return (
    <ContentShell
      role="company"
      title="Historial de entregas"
      breadcrumbs={["Empresa", "Entregas"]}
    >
        <div className="flex-1 overflow-y-auto">
            
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Entrega {route.id}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Calculada el {formattedDate} desde {route.warehouse_name}, CDMX
            </p>
          </div>

          <RouteStatusAlert status={route.status} />

          <RouteMetrics route={route} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RouteMap warehouseName={route.warehouse_name} details={route.solution?.details} />
            </div>

            <div className="lg:col-span-1">
              <DeliveryPointsList route={route} />
            </div>
          </div>
        </div>
    </ContentShell>
  );
}
