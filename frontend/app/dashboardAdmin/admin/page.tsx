'use client';

import { MapPin, Clock, ShieldCheck, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function DashboardAdminPage() {
  const warehousesScrollRef = useRef<HTMLDivElement>(null);
  const [warehousesScrollProgress, setWarehousesScrollProgress] = useState(0);

  const statsCards = [
    { id: 1, label: 'Companias', value: 24 },
    { id: 2, label: 'Almacenes', value: 38 },
    { id: 3, label: 'Usuarios', value: 146 },
    { id: 4, label: 'Rutas activas', value: 52 },
  ];

  const warehouses = [
    { id: 1, name: 'CDMX Centro', location: 'Ciudad de Mexico' },
    { id: 2, name: 'Monterrey Norte', location: 'Nuevo Leon' },
    { id: 3, name: 'Guadalajara Hub', location: 'Jalisco' },
    { id: 4, name: 'Puebla Centro', location: 'Puebla' },
    { id: 5, name: 'Queretaro Central', location: 'Queretaro' },
    { id: 6, name: 'Tijuana Norte', location: 'Baja California' },
    { id: 7, name: 'Merida Sur', location: 'Yucatan' },
    { id: 8, name: 'Toluca Poniente', location: 'Estado de Mexico' },
  ];

  const recentActivity = [
    { id: 1, action: 'Permisos actualizados', description: 'Se actualizaron permisos del modulo de Operaciones', time: 'Hace 2 horas', type: 'success', user: 'Admin Root' },
    { id: 2, action: 'Usuario creado', description: 'Nuevo usuario agregado al area de TI', time: 'Hace 3 horas', type: 'info', user: 'Sistema' },
    { id: 3, action: 'Politica aplicada', description: 'Nueva politica de acceso en Seguridad', time: 'Hace 5 horas', type: 'info', user: 'Laura V.' },
    { id: 4, action: 'Intento bloqueado', description: 'Intento de acceso no autorizado detectado', time: 'Hace 6 horas', type: 'warning', user: 'Firewall' },
    { id: 5, action: 'Respaldo completado', description: 'Respaldo diario de configuraciones finalizado', time: 'Hace 8 horas', type: 'success', user: 'Job Scheduler' },
  ];

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, setProgress: (value: number) => void) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setProgress(progress);
    }
  };

  useEffect(() => {
    const warehousesEl = warehousesScrollRef.current;

    const handleWarehousesScroll = () => handleScroll(warehousesScrollRef, setWarehousesScrollProgress);

    warehousesEl?.addEventListener('scroll', handleWarehousesScroll);

    return () => {
      warehousesEl?.removeEventListener('scroll', handleWarehousesScroll);
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: '#22c55e' }} />;
      case 'warning':
        return <AlertCircle size={18} style={{ color: '#E27D2A' }} />;
      default:
        return <ShieldCheck size={18} style={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[14px] md:text-[15px]" style={{ backgroundColor: '#0f1115' }}>
      <div className="shrink-0 px-4 py-4 md:px-6 md:py-5" style={{ backgroundColor: '#161A20' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#BBBDC0' }}>Dashboard Admin</h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>Panel de administracion central</p>
          </div>
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#E27D2A', backgroundColor: '#1a1f26' }}
          >
            <User size={20} style={{ color: '#E27D2A' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 md:px-6 md:py-5 overflow-x-hidden">
        <div className="mb-4">
          <h2 className="text-base md:text-lg font-semibold" style={{ color: '#BBBDC0' }}>Estadisticas del sistema</h2>
          <p className="text-sm" style={{ color: '#6b7280' }}>Resumen general del sistema</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border p-4"
              style={{ backgroundColor: '#161A20', borderColor: '#2a2f38' }}
            >
              <p className="text-xs uppercase tracking-wide" style={{ color: '#6b7280' }}>{card.label}</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: '#BBBDC0' }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-10 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold" style={{ color: '#BBBDC0' }}>Almacenes</h2>
              <p className="text-sm" style={{ color: '#6b7280' }}>{warehouses.length} almacenes activos</p>
            </div>
            <a href="#" className="text-sm font-medium hover:underline shrink-0" style={{ color: '#E27D2A' }}>
              Administrar almacenes
            </a>
          </div>

          <div
            ref={warehousesScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className="flex-none w-34 md:w-37 rounded-xl p-3 md:p-4 border transition-all duration-200 cursor-pointer hover:border-[#E27D2A]/50"
                style={{ backgroundColor: '#161A20', borderColor: '#2a2f38' }}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e2329' }}>
                    <ShieldCheck size={24} style={{ color: '#E27D2A' }} />
                  </div>
                </div>
                <h3 className="font-medium text-sm text-center mb-1" style={{ color: '#BBBDC0' }}>{warehouse.name}</h3>
                <p className="text-xs flex items-center justify-center gap-1" style={{ color: '#6b7280' }}>
                  <MapPin size={12} style={{ color: '#E27D2A' }} />
                  {warehouse.location}
                </p>
              </div>
            ))}
          </div>

          <div className="w-full h-1 rounded-full mt-3 relative" style={{ backgroundColor: '#2a2f38' }}>
            <div
              className="h-full rounded-full absolute transition-all duration-150"
              style={{
                backgroundColor: '#E27D2A',
                width: '30%',
                left: `${warehousesScrollProgress * 0.7}%`
              }}
            />
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-semibold mb-1" style={{ color: '#BBBDC0' }}>Actividad reciente</h2>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Ultimos movimientos administrativos</p>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#161A20', borderColor: '#2a2f38' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-150">
                <thead>
                  <tr style={{ backgroundColor: '#1a1f26' }}>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Accion</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Descripcion</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Usuario</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-t transition-colors hover:bg-[#1a1f26]"
                      style={{ borderColor: '#2a2f38' }}
                    >
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: '#0f1115' }}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                          <span className="font-medium text-sm whitespace-nowrap" style={{ color: '#BBBDC0' }}>{activity.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm" style={{ color: '#6b7280' }}>{activity.description}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: '#E27D2A' }}
                          >
                            <User size={12} style={{ color: '#0f1115' }} />
                          </div>
                          <span className="text-sm whitespace-nowrap" style={{ color: '#BBBDC0' }}>{activity.user}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock size={12} style={{ color: '#6b7280' }} />
                          <span className="text-sm whitespace-nowrap" style={{ color: '#6b7280' }}>{activity.time}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
