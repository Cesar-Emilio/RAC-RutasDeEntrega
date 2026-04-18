"use client";

import { Search, Filter, Plus, ChevronDown } from "lucide-react";

interface FiltersProps {
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly statusFilter: string;
  readonly onStatusFilterChange: (value: string) => void;
  readonly onNewRoute: () => void;
}

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "in-progress", label: "En progreso" },
  { value: "completed", label: "Completado" },
];

export function Filters({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onNewRoute,
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar un almacen..."
          className="
            w-full pl-10 pr-4 py-2.5 rounded-lg
            bg-surface border border-border
            text-text-primary placeholder:text-text-light
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            transition-all duration-200
          "
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="
            appearance-none pl-10 pr-10 py-2.5 rounded-lg
            bg-surface border border-border
            text-text-primary
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            transition-all duration-200
            cursor-pointer
          "
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
      </div>

      {/* New Route Button */}
      <button
        onClick={onNewRoute}
        className="
          flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg
          bg-primary-500 hover:bg-primary-400
          text-white font-medium
          transition-colors duration-200
          whitespace-nowrap
        "
      >
        <Plus className="w-4 h-4" />
        <span>Nueva ruta</span>
      </button>
    </div>
  );
}
