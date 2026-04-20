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
    <div className="mb-6">
      <SectionHeader
        step={3}
        title="Opciones especiales"
        description="Configura opciones adicionales para el cálculo"
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-3.5">
          <div>
            <h4 className="mb-1 text-sm font-medium text-text-primary">
              Optimización K-Opt
            </h4>

            <p className="text-xs text-text-secondary sm:text-sm">
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
              w-16 rounded-lg border border-border px-2 py-1.5
              text-center bg-background
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
        </div>
      </div>
    </div>
  );
}