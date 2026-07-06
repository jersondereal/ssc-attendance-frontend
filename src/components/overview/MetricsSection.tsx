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
  headerActions?: ReactNode;
}

export function MetricsSection({
  title,
  children,
  range,
  direction = "row",
  onRangeChange,
  containerClassName,
  headerActions,
}: MetricsSectionProps) {
  const hasRangeSelect = onRangeChange && range !== undefined;
  const showHeader = Boolean(title || headerActions || hasRangeSelect);
  return (
    <div className={`w-full md:w-fit ${containerClassName}`}>
      {showHeader && (
        <div className="mb-3 flex flex-col md:flex-row md:justify-between gap-3">
          {title && (
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          )}
          {headerActions}
          {hasRangeSelect && (
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
      )}
      <div className={`flex ${direction === "row" ? "flex-row" : "flex-col"} gap-4`}>
        {children}
      </div>
    </div>
  );
}
