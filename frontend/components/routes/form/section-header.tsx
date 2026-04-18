interface SectionHeaderProps {
  step: number;
  title: string;
  description: string;
}

export const SectionHeader = ({
  step,
  title,
  description,
}: SectionHeaderProps) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-medium">
        {step}
      </span>

      <div>
        <h3 className="text-base font-medium text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}