interface MetricCardProps {
  label: string;
  value: string;
  className?: string;
}

export function MetricCard({ label, value, className = "" }: MetricCardProps) {
  return (
    <div
      className={`rounded-[10px] border border-border-dark p-4 w-full bg-gray-50 ${className}`}
    >
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
