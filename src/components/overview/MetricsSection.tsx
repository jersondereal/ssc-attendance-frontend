import type { ReactNode } from "react";
import { RANGE_OPTIONS } from "../../constants/metrics";
export type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

interface MetricsSectionProps {
  title: string;
  children: ReactNode;
  range?: RangeValue;
  direction?: "row" | "column";
  containerClassName?: string;
  onRangeChange?: (value: RangeValue) => void;
}

export function MetricsSection({
  title,
  children,
  range,
  direction = "row",
  onRangeChange,
  containerClassName,
}: MetricsSectionProps) {
  return (
    <div className={`bg-white w-full md:w-fit ${containerClassName}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {onRangeChange && range !== undefined && (
          <select
            className="text-xs border border-gray-200 rounded-md px-2 py-1"
            value={range}
            onChange={(e) => onRangeChange(e.target.value as RangeValue)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className={`flex ${direction === "row" ? "flex-row" : "flex-col"} gap-4`}>
        {children}
      </div>
    </div>
  );
}
