'use client';

import { MapPin, ChevronRight, Package, Clock, Truck, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function DashboardCompanies() {
  const warehousesScrollRef = useRef<HTMLDivElement>(null);
  const routesScrollRef = useRef<HTMLDivElement>(null);
  const [warehousesScrollProgress, setWarehousesScrollProgress] = useState(0);
  const [routesScrollProgress, setRoutesScrollProgress] = useState(0);

  const warehouses = [
    { id: 1, name: 'CDMX Centro', location: 'Ciudad de méxico' },
    { id: 2, name: 'CDMX Norte', location: 'Ciudad de méxico' },
    { id: 3, name: 'Guadalajara', location: 'Jalisco' },
    { id: 4, name: 'Monterrey', location: 'Nuevo León' },
    { id: 5, name: 'Puebla Centro', location: 'Puebla' },
    { id: 6, name: 'Querétaro', location: 'Querétaro' },
    { id: 7, name: 'Tijuana', location: 'Baja California' },
    { id: 8, name: 'Mérida', location: 'Yucatán' },
  ];

  const routes = [
    { id: 1, packages: 24, date: '15 Feb 2025', location: 'CDMX Centro', status: 'completada' },
    { id: 2, packages: 18, date: '14 Feb 2025', location: 'Monterrey', status: 'completada' },
    { id: 3, packages: 32, date: '13 Feb 2025', location: 'Guadalajara', status: 'completada' },
    { id: 4, packages: 15, date: '12 Feb 2025', location: 'Puebla', status: 'completada' },
    { id: 5, packages: 28, date: '11 Feb 2025', location: 'Querétaro', status: 'completada' },
    { id: 6, packages: 20, date: '10 Feb 2025', location: 'Tijuana', status: 'completada' },
    { id: 7, packages: 22, date: '09 Feb 2025', location: 'Mérida', status: 'completada' },
    { id: 8, packages: 30, date: '08 Feb 2025', location: 'CDMX Norte', status: 'completada' },
  ];

  const recentActivity = [
    { id: 1, action: 'Ruta completada', description: 'Entrega de 24 paquetes en CDMX Centro', time: 'Hace 2 horas', type: 'success', user: 'Carlos M.' },
    { id: 2, action: 'Nueva ruta asignada', description: 'Ruta #1842 asignada a conductor Juan P.', time: 'Hace 3 horas', type: 'info', user: 'Sistema' },
    { id: 3, action: 'Almacén actualizado', description: 'Inventario actualizado en Monterrey', time: 'Hace 5 horas', type: 'info', user: 'Ana G.' },
    { id: 4, action: 'Retraso reportado', description: 'Ruta #1839 con retraso de 30 min', time: 'Hace 6 horas', type: 'warning', user: 'Pedro L.' },
    { id: 5, action: 'Ruta completada', description: 'Entrega de 18 paquetes en Guadalajara', time: 'Hace 8 horas', type: 'success', user: 'Miguel R.' },
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
    const routesEl = routesScrollRef.current;

    const handleWarehousesScroll = () => handleScroll(warehousesScrollRef, setWarehousesScrollProgress);
    const handleRoutesScroll = () => handleScroll(routesScrollRef, setRoutesScrollProgress);

    warehousesEl?.addEventListener('scroll', handleWarehousesScroll);
    routesEl?.addEventListener('scroll', handleRoutesScroll);

    return () => {
      warehousesEl?.removeEventListener('scroll', handleWarehousesScroll);
      routesEl?.removeEventListener('scroll', handleRoutesScroll);
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: '#22c55e' }} />;
      case 'warning':
        return <AlertCircle size={18} style={{ color: '#E27D2A' }} />;
      default:
        return <Truck size={18} style={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[14px] md:text-[15px]" style={{ backgroundColor: '#0f1115' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 md:px-6 md:py-5" style={{ backgroundColor: '#161A20' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#BBBDC0' }}>Dashboard</h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>Panel de administracion de la empresa</p>
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
        {/* Almacenes Section */}
        <div className="mb-10 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold" style={{ color: '#BBBDC0' }}>Almacenes</h2>
              <p className="text-sm" style={{ color: '#6b7280' }}>{warehouses.length} almacenes activos</p>
            </div>
            <a href="#" className="text-sm font-medium hover:underline flex-shrink-0" style={{ color: '#E27D2A' }}>
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
                className="flex-none w-[136px] md:w-[148px] rounded-xl p-3 md:p-4 border transition-all duration-200 cursor-pointer hover:border-[#E27D2A]/50"
                style={{ backgroundColor: '#161A20', borderColor: '#2a2f38' }}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e2329' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="#E27D2A" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M12 12L20 7" stroke="#E27D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12V21" stroke="#E27D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12L4 7" stroke="#E27D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 5L8 9.5" stroke="#E27D2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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

          {/* Scrollbar visual dinamica */}
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

        {/* Historial de Rutas Section */}
        <div className="mb-10 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold" style={{ color: '#BBBDC0' }}>Historial de rutas</h2>
              <p className="text-sm" style={{ color: '#6b7280' }}>Últimas rutas calculadas</p>
            </div>
            <a href="#" className="text-sm font-medium hover:underline flex-shrink-0" style={{ color: '#E27D2A' }}>
              Calcular nueva ruta
            </a>
          </div>

          <div 
            ref={routesScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {routes.map((route) => (
              <div
                key={route.id}
                className="flex-none w-[168px] md:w-[176px] rounded-xl p-3 md:p-4 border transition-all duration-200 cursor-pointer hover:border-[#E27D2A]/50"
                style={{ backgroundColor: '#161A20', borderColor: '#2a2f38' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: '#E27D2A', color: '#0f1115' }}
                  >
                    {route.status}
                  </span>
                  <ChevronRight size={14} style={{ color: '#6b7280' }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} style={{ color: '#E27D2A' }} />
                  <span className="font-semibold" style={{ color: '#BBBDC0' }}>{route.packages} paquetes</span>
                </div>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {route.date} | {route.location}
                </p>
              </div>
            ))}
          </div>

          {/* Scrollbar visual dinamica */}
          <div className="w-full h-1 rounded-full mt-3 relative" style={{ backgroundColor: '#2a2f38' }}>
            <div 
              className="h-full rounded-full absolute transition-all duration-150"
              style={{ 
                backgroundColor: '#E27D2A', 
                width: '30%',
                left: `${routesScrollProgress * 0.7}%`
              }}
            />
          </div>
        </div>

        {/* Actividad Reciente Section */}
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-semibold mb-1" style={{ color: '#BBBDC0' }}>Actividad reciente</h2>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Últimos movimientos del sistema</p>

          <div 
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#161A20', borderColor: '#2a2f38' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ backgroundColor: '#1a1f26' }}>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Acción</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Descripción</th>
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
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
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
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
