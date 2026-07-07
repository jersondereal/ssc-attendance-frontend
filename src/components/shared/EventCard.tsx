import {
  CalendarDays,
  Clock,
  Ellipsis,
  MapPin,
  PhilippinePeso,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
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
  const currentUser = useAuthStore((s) => s.currentUser);
  const isViewer = currentUser?.rawRole === "viewer";
  const hasActions = Boolean(onMenuClick || onEditClick || onDeleteClick);
  const canShowMenu = hasActions && (canEdit || canDelete);

  return (
    <div
      className={`relative w-full h-full flex flex-col rounded-[10px] p-4 transition-all border-gray-150 bg-white border ${
        isSelected
          ? "border border-gray-300 bg-gray-300"
          : " hover:border-zinc-400"
      }`}
    >
      <div
        className={`flex flex-1 flex-col pr-8 ${onCardClick ? "cursor-pointer" : ""}`}
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
        <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-gray-400" />
            {event.location}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-gray-400" />
            {new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {event.time && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-gray-400" />
              {new Date(`1970-01-01T${event.time}`).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit" }
              )}
            </span>
          )}
          {!isViewer && (
            <span className="flex items-center gap-1.5">
              <PhilippinePeso className="size-3.5 shrink-0 text-gray-400" />
              {event.fine}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-auto pt-3">
          <EventBadges event={event} />
        </div>
      </div>
      <div
        ref={isMenuOpen ? menuRef : undefined}
        className="absolute right-3 top-3 z-10"
      >
        {canShowMenu && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-[8px] transition-all hover:bg-gray-100"
            aria-label="Event actions"
          >
            <Ellipsis
              size={16}
              className="text-gray-500 hover:text-gray-600 transitiona-all"
            />
          </button>
        )}
        {isMenuOpen && canShowMenu && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-[8px] shadow-lg z-[100] w-28 p-1.5">
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
