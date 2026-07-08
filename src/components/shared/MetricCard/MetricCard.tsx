import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  onViewAll?: () => void;
}

export function MetricCard({
  label,
  value,
  icon,
  className = "",
  labelClassName = "",
  valueClassName = "",
  onViewAll,
}: MetricCardProps) {
  return (
    <div
      role={onViewAll ? "button" : undefined}
      tabIndex={onViewAll ? 0 : undefined}
      onClick={onViewAll}
      onKeyDown={(e) => {
        if (onViewAll && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onViewAll();
        }
      }}
      className={`rounded-[10px] p-4 w-full bg-white border border-gray-150 ${
        onViewAll ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        {icon && (
          <div className="mb-3 flex w-fit items-center justify-center rounded-[20px] bg-sscThemeLight p-3 text-sscThemeIcon">
            {icon}
          </div>
        )}
        {onViewAll && (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
            View all
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
      <div className={`text-2xl mt-4 text-gray-900 ${valueClassName}`}>{value}</div>
      <div className={`mt-2 text-sm text-gray-500 ${labelClassName}`}>{label}</div>
    </div>
  );
}
