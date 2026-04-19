import { SectionHeader } from "./section-header";

interface RouteOptionsProps {
  kOpt: number;
  allowOutOfState: boolean;
  onKOptChange: (value: number) => void;
  onToggle: () => void;
}

export const RouteOptions = ({
  kOpt,
  allowOutOfState,
  onKOptChange,
  onToggle,
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

        <div className="p-4 rounded-lg bg-surface border border-border flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">
              Permitir entregas fuera del estado
            </h4>

            <p className="text-sm text-text-secondary">
              Incluye paquetes fuera del estado del almacén.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            role="switch"
            aria-checked={allowOutOfState}
            className={`
              relative w-11 h-6 rounded-full transition-colors cursor-pointer
              ${allowOutOfState ? "bg-primary-500" : "bg-border"}
            `}
          >
            <span
              className={`
                absolute top-0.5 left-0.5
                w-5 h-5 rounded-full bg-white
                transition-transform
                ${allowOutOfState ? "translate-x-5" : ""}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  );
}