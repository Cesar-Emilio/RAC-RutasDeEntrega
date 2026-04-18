"use client";

import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";

interface FiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  onNewWarehouse: () => void;
}

const filterOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export function FiltersBar({
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  onNewWarehouse,
}: FiltersBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const selectedFilter = filterOptions.find((f) => f.value === filterValue);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar un almacén..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filter Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-primary-500 transition-colors w-full sm:w-auto"
        >
          <Filter className="w-4 h-4" />
          <span className="flex-1 text-left">{selectedFilter?.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
        </button>

        {isFilterOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
            <div className="absolute top-full right-0 mt-2 w-52 bg-[var(--color-surface-elevated,#1e1e2e)] border border-border rounded-xl shadow-xl z-20 overflow-hidden py-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { onFilterChange(option.value); setIsFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterValue === option.value
                      ? "bg-primary-500 text-white font-medium"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New Warehouse Button */}
      <button
        onClick={onNewWarehouse}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 active:scale-95 text-white font-semibold rounded-xl transition-all duration-150 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Nuevo almacén</span>
      </button>
    </div>
  );
}