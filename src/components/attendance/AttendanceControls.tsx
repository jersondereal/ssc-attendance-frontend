import { Button } from "../common/Button/Button";
import { DropdownSelector } from "../common/DropdownSelector/DropdownSelector";
import {
  EventSelector,
  type Event,
} from "../common/EventSelector/EventSelector";
import { SearchBar } from "../common/SearchBar/SearchBar";

interface AttendanceControlsProps {
  tableType: "attendance" | "students";
  selectedEvent?: Event;
  events: Event[];
  onEventChange: (event: Event) => void;
  onAddEvent: (data: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
    colleges?: Event["colleges"];
    sections?: Event["sections"];
    schoolYears?: Event["schoolYears"];
  }) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  currentUserRole?: string;
  canAddEvent?: boolean;
  canEditEvent?: boolean;
  canDeleteEvent?: boolean;
  onRfidClick: () => void;
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
  hasAttendanceTableData: boolean;
}

export function AttendanceControls({
  tableType,
  selectedEvent,
  events,
  onEventChange,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  currentUserRole,
  canAddEvent = true,
  canEditEvent = true,
  canDeleteEvent = true,
  onRfidClick,
  onAddStudent,
  selectedFilters,
  onFilterChange,
  onSearch,
  collegeOptions,
  yearOptions,
  sectionOptions,
  hasAttendanceTableData,
}: AttendanceControlsProps) {
  return (
    <div className="flex md:flex-row flex-col mr-0 sm:mr-3 gap-3 min-w-full md:min-w-auto">
      {/* Date and Event Group */}
      {tableType === "attendance" && (
        <div className="flex flex-row gap-3 items-center">
          <EventSelector
            value={selectedEvent}
            onChange={onEventChange}
            placeholder="Select event"
            events={events}
            onAddEvent={onAddEvent}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
            currentUserRole={currentUserRole}
            canAddEvent={canAddEvent}
            canEditEvent={canEditEvent}
            canDeleteEvent={canDeleteEvent}
            hasTableData={hasAttendanceTableData}
          />
          {currentUserRole !== "Viewer" && (
            <Button
              label="RFID Check-In"
              variant="primary"
              onClick={onRfidClick}
            />
          )}
        </div>
      )}
      {tableType === "students" && (
        <Button
          className="mr-3"
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
        </div>
        <SearchBar onSearch={onSearch} />
      </div>
    </div>
  );
}
