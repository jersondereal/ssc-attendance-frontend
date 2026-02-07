import { Ellipsis } from "lucide-react";
import { EventBadges } from "./EventBadges";
import type { Event } from "./types";

interface EventDropdownItemProps {
  event: Event;
  isSelected: boolean;
  onSelect: (event: Event) => void;
  onMenuClick: (eventId: string, e: React.MouseEvent) => void;
  isMenuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onEditClick: (event: Event, e: React.MouseEvent) => void;
  onDeleteClick: (eventId: string, e: React.MouseEvent) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function EventDropdownItem({
  event,
  isSelected,
  onSelect,
  onMenuClick,
  isMenuOpen,
  menuRef,
  onEditClick,
  onDeleteClick,
  canEdit = true,
  canDelete = true,
}: EventDropdownItemProps) {
  const hasActions = canEdit || canDelete;

  return (
    <div className="relative group w-full">
      <button
        type="button"
        onClick={() => onSelect(event)}
        className={`flex flex-col w-full text-left p-4 transition-all text-sm gap-2 ${
          isSelected
            ? "bg-green-300/20 border border-green-500/20"
            : "hover:bg-green-100/30"
        }`}
      >
        <div className="font-semibold">{event.name}</div>
        <div className="flex flex-col gap-1">
          <div className="text-gray-500 text-sm flex flex-row items-center">
            {event.location}
          </div>
          <div className="text-gray-500 text-sm">
            {new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-gray-500 text-sm">₱{event.fine}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            <EventBadges event={event} />
          </div>
        </div>
      </button>
      <div
        ref={isMenuOpen ? menuRef : undefined}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
      >
        {hasActions && (
          <button
            type="button"
            onClick={(e) => onMenuClick(event.id, e)}
            className="p-1.5 rounded-[8px]"
            aria-label="Event actions"
          >
            <Ellipsis size={20} />
          </button>
        )}
        {isMenuOpen && hasActions && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-border-dark rounded-[8px] shadow-lg z-[100] w-28 p-1.5">
            <button
              type="button"
              onClick={canEdit ? (e) => onEditClick(event, e) : undefined}
              disabled={!canEdit}
              className={`w-full rounded-[8px] text-left px-3 py-2 text-sm ${
                canEdit ? "hover:bg-zinc-100" : "opacity-50 cursor-not-allowed"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={
                canDelete ? (e) => onDeleteClick(event.id, e) : undefined
              }
              disabled={!canDelete}
              className={`w-full rounded-[8px] text-left px-3 py-2 text-sm text-red-600 ${
                canDelete
                  ? "hover:bg-zinc-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
