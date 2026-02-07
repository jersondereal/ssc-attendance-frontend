import { Ellipsis } from "lucide-react";
import { EventBadges } from "../common/EventSelector/EventBadges";
import type { Event } from "../common/EventSelector/types";

interface EventCardProps {
  event: Event;
  isSelected?: boolean;
  onCardClick?: (event: Event) => void;
  isMenuOpen?: boolean;
  onMenuClick?: (e: React.MouseEvent) => void;
  onEditClick?: (e: React.MouseEvent) => void;
  onDeleteClick?: (e: React.MouseEvent) => void;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function EventCard({
  event,
  isSelected = false,
  onCardClick,
  isMenuOpen = false,
  onMenuClick,
  onEditClick,
  onDeleteClick,
  menuRef,
  canEdit = true,
  canDelete = true,
}: EventCardProps) {
  const hasActions = Boolean(onMenuClick || onEditClick || onDeleteClick);
  const canShowMenu = hasActions && (canEdit || canDelete);

  return (
    <div
      className={`relative w-full border border-border-dark rounded-[10px] p-4 transition-colors ${
        isSelected
          ? "bg-emerald-100/60 border-2 border-emerald-400/60"
          : "bg-gray-50 hover:bg-gray-100/80"
      }`}
    >
      <div
        className={`pr-8 ${onCardClick ? "cursor-pointer" : ""}`}
        onClick={() => onCardClick?.(event)}
        onKeyDown={(e) => {
          if (onCardClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onCardClick(event);
          }
        }}
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick ? 0 : undefined}
      >
        <div className="font-semibold text-gray-900">{event.name}</div>
        <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
          <span>{event.location}</span>
          <span>
            {new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>₱{event.fine}</span>
          <div className="flex flex-wrap gap-1 mt-2">
            <EventBadges event={event} />
          </div>
        </div>
      </div>
      <div
        ref={isMenuOpen ? menuRef : undefined}
        className="absolute right-2 top-4 z-10"
      >
        {canShowMenu && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-[8px] hover:bg-gray-200"
            aria-label="Event actions"
          >
            <Ellipsis size={20} />
          </button>
        )}
        {isMenuOpen && canShowMenu && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-border-dark rounded-[8px] shadow-lg z-[100] w-28 p-1.5">
            <button
              type="button"
              onClick={canEdit ? onEditClick : undefined}
              disabled={!canEdit}
              className={`w-full rounded-[8px] text-left px-3 py-2 text-sm ${
                canEdit ? "hover:bg-zinc-100" : "opacity-50 cursor-not-allowed"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={canDelete ? onDeleteClick : undefined}
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
