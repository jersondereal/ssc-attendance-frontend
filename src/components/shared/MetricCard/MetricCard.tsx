import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function MetricCard({ label, value, icon, className = "", labelClassName = "", valueClassName = "" }: MetricCardProps) {
  return (
    <div
      className={`rounded-[10px] p-4 w-full bg-white border border-gray-150 ${className}`}
    >
      {icon && (
        <div className="mb-3 flex w-fit items-center justify-center rounded-[20px] bg-sscThemeLight p-3 text-sscThemeIcon">
          {icon}
        </div>
      )}
      <div className={`text-2xl mt-4 text-gray-900 ${valueClassName}`}>{value}</div>
      <div className={`mt-2 text-sm text-gray-500 ${labelClassName}`}>{label}</div>
    </div>
  );
}
