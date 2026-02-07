import { LoaderCircle } from "lucide-react";
import { EventCard } from "../../shared";
import { Button } from "../Button/Button";
import type { Event } from "./types";
import { useEffect, useRef } from "react";

interface EventDropdownProps {
  events: Event[];
  selectedEvent: Event | undefined;
  isOpen: boolean;
  isVisible: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuOpenFor: string | null;
  currentUserRole?: string;
  canAddEvent?: boolean;
  canEditEvent?: boolean;
  canDeleteEvent?: boolean;
  onSelect: (event: Event) => void;
  onMenuClick: (eventId: string, e: React.MouseEvent) => void;
  onEditClick: (event: Event, e: React.MouseEvent) => void;
  onDeleteClick: (eventId: string, e: React.MouseEvent) => void;
  onAddEventClick: () => void;
  onCloseDropdown: () => void;
}

export function EventDropdown({
  events,
  selectedEvent,
  isOpen,
  isVisible,
  dropdownRef,
  menuRef,
  menuOpenFor,
  currentUserRole,
  canAddEvent = true,
  canEditEvent = true,
  canDeleteEvent = true,
  onSelect,
  onMenuClick,
  onEditClick,
  onDeleteClick,
  onAddEventClick,
  onCloseDropdown,
}: EventDropdownProps) {
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to the selected event when dropdown opens
  useEffect(() => {
    if (isOpen && selectedEvent && eventRefs.current[selectedEvent.id]) {
      eventRefs.current[selectedEvent.id]?.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [isOpen, selectedEvent]);

  if (!isVisible) return null;

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full mt-1 bg-white border border-border-dark rounded-[14px] shadow-lg z-20 min-w-[200px] w-[90vw] max-w-[400px]
        transition-all duration-200 ease-in-out left-0
        ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none -translate-y-2"
        }
      `}
      style={{ transformOrigin: "top" }}
    >
      <div className="max-h-[460px] w-full overflow-y-auto p-3 flex flex-col gap-3">
        {sortedEvents.length === 0 ? (
          <div className="flex justify-center items-center py-4">
            <LoaderCircle className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          sortedEvents.map((event) => (
            <div
              key={event.id}
              ref={el => {
                eventRefs.current[event.id] = el;
              }}
            >
              <EventCard
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onCardClick={onSelect}
                isMenuOpen={menuOpenFor === event.id}
                menuRef={menuRef}
                onMenuClick={(e) => onMenuClick(event.id, e)}
                onEditClick={(e) => onEditClick(event, e)}
                onDeleteClick={(e) => onDeleteClick(event.id, e)}
                canEdit={canEditEvent}
                canDelete={canDeleteEvent}
              />
            </div>
          ))
        )}
      </div>
      <div
        className={`pt-2 m-2 ${currentUserRole === "Viewer" ? "hidden" : ""}`}
      >
        {currentUserRole !== "Viewer" && (
          <Button
            className="w-full flex items-center justify-center gap-1 py-1.5 text-sm text-black hover:bg-gray-100 rounded-[8px] font-medium"
            label="Add Event"
            variant="secondary"
            disabled={!canAddEvent}
            onClick={() => {
              if (!canAddEvent) return;
              onAddEventClick();
              onCloseDropdown();
            }}
          />
        )}
      </div>
    </div>
  );
}
