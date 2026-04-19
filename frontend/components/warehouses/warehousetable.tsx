import { MapPin, Pencil, Power, Warehouse } from "lucide-react";

export interface WarehouseData {
  id: number;
  name: string;
  city: string;
  state: string;
  postal_code: string;   
  latitude: number;      
  longitude: number
  address: string;
  active: boolean;
}

interface WarehouseTableProps {
  warehouses: WarehouseData[];
  onEdit: (warehouse: WarehouseData) => void;
  onToggleStatus: (warehouse: WarehouseData) => void;
}

export function WarehouseTable({ warehouses, onEdit, onToggleStatus }: WarehouseTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Nombre</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Ubicación</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Dirección</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Estado</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-sm text-text-muted">
                No se encontraron almacenes
              </td>
            </tr>
          ) : (
            warehouses.map((warehouse) => (
              <tr
                key={warehouse.id}
                className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <Warehouse className="w-4 h-4 text-primary-500" />
                    </div>
                    <span className="font-medium text-text-primary">{warehouse.name}</span>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="w-4 h-4 text-accent-green flex-shrink-0" />
                    <span>{warehouse.city}, {warehouse.state}</span>
                  </div>
                </td>

                <td className="py-4 px-4 text-text-secondary text-sm">
                  {warehouse.address}
                </td>

                <td className="py-4 px-4">
                  <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium border ${
                    warehouse.active
                      ? "bg-success-bg text-success border-success/30"
                      : "bg-surface-elevated text-text-muted border-border"
                  }`}>
                    {warehouse.active ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(warehouse)}
                      className="p-2 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors cursor-pointer"
                      title="Editar almacén"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleStatus(warehouse)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        warehouse.active
                          ? "text-text-muted hover:text-red-400 hover:bg-red-500/10"
                          : "text-text-muted hover:text-success hover:bg-success/10"
                      }`}
                      title={warehouse.active ? "Desactivar almacén" : "Activar almacén"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}