import { RefreshCw } from "lucide-react";
import { Button } from "../common/Button/Button";
import { DropdownSelector } from "../common/DropdownSelector/DropdownSelector";
import { SearchBar } from "../common/SearchBar/SearchBar";

interface AttendanceControlsProps {
  tableType: "attendance" | "students";
  currentUserRole?: string;
  onQRScanClick: () => void;
  onAddStudent: () => void;
  selectedFilters: {
    college: string;
    year: string;
    section: string;
  };
  onFilterChange: (
    filter: "college" | "year" | "section",
    value: string
  ) => void;
  onSearch: (value: string) => void;
  collegeOptions: { value: string; label: string }[];
  yearOptions: { value: string; label: string }[];
  sectionOptions: { value: string; label: string }[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function AttendanceControls({
  tableType,
  currentUserRole,
  onQRScanClick,
  onAddStudent,
  selectedFilters,
  onFilterChange,
  onSearch,
  collegeOptions,
  yearOptions,
  sectionOptions,
  onRefresh,
  isRefreshing = false,
}: AttendanceControlsProps) {
  return (
    <div className="flex md:flex-row flex-col mr-0 sm:mr-3 gap-3 min-w-full md:min-w-auto">
      {tableType === "attendance" && currentUserRole !== "Viewer" && (
        <div className="flex flex-row gap-3 items-center">
          <Button
            label="QR Scan"
            variant="primary"
            onClick={onQRScanClick}
          />
        </div>
      )}
      {tableType === "students" && (
        <Button
          onClick={onAddStudent}
          label="Student Registration"
          variant="primary"
          title="Add New Student"
        />
      )}
      {/* Filters Section */}
      <div className="flex flex-col gap-4 gap md:flex-row items-center justify-between w-full text-xs">
        <div className="flex flex-row items-center gap-3 w-full text-xs">
          <DropdownSelector
            placeholder="College"
            options={collegeOptions}
            value={selectedFilters.college}
            onChange={(value) => onFilterChange("college", value)}
            className="max-w-32"
            dropdownClassName="w-[40vw] min-w-[300px] max-w-[340px]"
          />
          <DropdownSelector
            placeholder="Year"
            options={yearOptions}
            value={selectedFilters.year}
            onChange={(value) => onFilterChange("year", value)}
            className="max-w-32"
          />
          <DropdownSelector
            placeholder="Section"
            options={sectionOptions}
            value={selectedFilters.section}
            onChange={(value) => onFilterChange("section", value)}
            className="max-w-32"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
            title="Refresh data"
            className="flex shrink-0 items-center justify-center rounded-[8px] border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <SearchBar onSearch={onSearch} />
      </div>
    </div>
  );
}
