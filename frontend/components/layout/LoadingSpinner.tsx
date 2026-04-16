type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className = "" }: Readonly<LoadingSpinnerProps>) {
  return (
    <div
      className={`h-10 w-10 animate-spin rounded-full border-4 border-divider border-t-primary-500 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}