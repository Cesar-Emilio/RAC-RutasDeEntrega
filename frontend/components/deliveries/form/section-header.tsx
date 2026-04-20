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
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[11px] font-medium text-white">
        {step}
      </span>

      <div>
        <h3 className="text-sm font-medium text-text-primary sm:text-base">{title}</h3>
        <p className="text-xs text-text-secondary sm:text-sm">{description}</p>
      </div>
    </div>
  );
}