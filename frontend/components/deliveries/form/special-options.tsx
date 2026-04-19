import { SectionHeader } from "./section-header";

interface RouteOptionsProps {
  kOpt: number;
  onKOptChange: (value: number) => void;
}

export const RouteOptions = ({
  kOpt,
  onKOptChange,
}: RouteOptionsProps) => {
  return (
    <div className="mb-10">
      <SectionHeader
        step={3}
        title="Opciones especiales"
        description="Configura opciones adicionales para el cálculo"
      />

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">
              Optimización K-Opt
            </h4>

            <p className="text-sm text-text-secondary">
              Nivel de optimización entre 0 y 10.
            </p>
          </div>

          <input
            type="number"
            min={0}
            max={10}
            value={kOpt}
            onChange={(e) => onKOptChange(Number(e.target.value))}
            className="
              w-20 px-3 py-2 rounded-lg border border-border
              text-center bg-background
            "
          />
        </div>
      </div>
    </div>
  );
}