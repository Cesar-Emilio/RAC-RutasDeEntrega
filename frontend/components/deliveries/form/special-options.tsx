import { SectionHeader } from "./section-header";

interface RouteOptionsProps {
  kOpt: number;
  onKOptChange: (value: number) => void;
}

export const RouteOptions = ({
  kOpt,
  onKOptChange,
}: RouteOptionsProps) => {

const handleChange = (value: number) => {
  const safeValue = Math.min(10, Math.max(0, value));
  onKOptChange(safeValue);
};

  return (
    <div className="mb-6">
      <SectionHeader
        step={3}
        title="Opciones especiales"
        description="Configura opciones adicionales para el cálculo"
      />

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-surface p-3.5">
          <div className="mb-4 flex items-center justify-between gap-4">
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
              onChange={(e) => handleChange(Number(e.target.value))}
              className="
                w-16 rounded-lg border border-border px-2 py-1.5
                text-center bg-background
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              "
            />
          </div>

          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={kOpt}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full cursor-pointer color-primary-500 accent-primary-500"
          />

          <div className="mt-2 flex justify-between text-xs text-secondary">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
};