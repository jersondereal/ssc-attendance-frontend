import EventIcon from "@mui/icons-material/Event";
import { useEffect, useRef, useState } from "react";
import { AddEventForm } from "../../forms/AddEventForm/AddEventForm";
import { EditEventForm } from "../../forms/EditEventForm/EditEventForm";
import { Modal } from "../Modal/Modal";
import { DeleteEventModal } from "./DeleteEventModal";
import { EventDropdown } from "./EventDropdown";
import type { AddEventData, Event, EventSelectorProps } from "./types";

export type { Event } from "./types";

const LAST_SELECTED_EVENT_KEY = "lastSelectedEventId";

/**
 * If there is already data in the table, don't auto-open the event selector.
 * Consumer must pass `hasTableData` (boolean) prop if they want this auto-open-to-behavior.
 */
export const EventSelector = ({
  className = "",
  value,
  onChange,
  placeholder = "Select event",
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  currentUserRole,
  canAddEvent = true,
  canEditEvent = true,
  canDeleteEvent = true,
  hasTableData,
}: EventSelectorProps & { hasTableData?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [deleteEventConfirmChecked, setDeleteEventConfirmChecked] =
    useState(false);
  // Use undefined as default to allow resolution from localStorage if no value prop
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(() => {
    if (value) return value;
    // Attempt to restore from localStorage, but only if value is not passed
    try {
      const lastId = localStorage.getItem(LAST_SELECTED_EVENT_KEY);
      if (lastId && Array.isArray(events)) {
        const match = events.find(
          (ev) => (ev.id && ev.id.toString()) === lastId
        );
        return match;
      }
    } catch (e) {
      console.error(
        "Error restoring last selected event from localStorage:",
        e
      );
    }
    return undefined;
  });
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const eventSelectorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect for updating selectedEvent when value or hasTableData changes (and localStorage interaction)
  useEffect(() => {
    if (value) {
      setSelectedEvent(value);
      // Persist to localStorage
      try {
        if (value.id) {
          localStorage.setItem(LAST_SELECTED_EVENT_KEY, value.id.toString());
        }
      } catch (e) {
        console.error(
          "Error persisting last selected event to localStorage:",
          e
        );
      }
    } else {
      // On mount or value cleared, try restore from localStorage
      try {
        const lastId = localStorage.getItem(LAST_SELECTED_EVENT_KEY);
        if (lastId && events && events.length > 0) {
          const found = events.find(
            (ev) => (ev.id && ev.id.toString()) === lastId
          );
          setSelectedEvent(found);
          // Optionally, fire onChange if found and no value prop so selection rehydrates outward
          if (found && !value && typeof onChange === "function") {
            onChange(found);
          }
        } else {
          setSelectedEvent(undefined);
        }
      } catch (e) {
        console.error(
          "Error restoring last selected event from localStorage:",
          e
        );
        setSelectedEvent(undefined);
      }
    }
    // Only close the dropdown when there is table data; never auto-open when there isn't
    if (hasTableData) {
      setIsOpen(false);
      setIsDropdownVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hasTableData, events]); // respond to events changing as well

  const handleOpenDropdown = () => {
    setIsDropdownVisible(true);
    setTimeout(() => setIsOpen(true), 10);
  };

  const handleCloseDropdown = () => {
    setIsOpen(false);
    setTimeout(() => setIsDropdownVisible(false), 200);
  };

  const handleToggleDropdown = () => {
    if (isOpen) handleCloseDropdown();
    else handleOpenDropdown();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        eventSelectorRef.current &&
        !eventSelectorRef.current.contains(event.target as Node)
      ) {
        handleCloseDropdown();
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    try {
      if (event.id) {
        localStorage.setItem(LAST_SELECTED_EVENT_KEY, event.id.toString());
      }
    } catch (e) {
      console.error("Error persisting last selected event to localStorage:", e);
    }
    onChange?.(event);
    handleCloseDropdown();
  };

  const handleAddEvent = (data: AddEventData) => {
    onAddEvent?.(data);
    setIsAddEventModalOpen(false);
  };

  const handleMenuClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenFor(menuOpenFor === eventId ? null : eventId);
  };

  const handleEditClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullEvent = events.find((ev) => ev.id === event.id);
    if (fullEvent) {
      setEventToEdit(fullEvent);
      setIsEditModalOpen(true);
    }
    setMenuOpenFor(null);
  };

  const handleEditSubmit = (data: AddEventData) => {
    if (eventToEdit) {
      onEditEvent?.({
        ...eventToEdit,
        name: data.title,
        date: data.event_date,
        location: data.location,
        fine: data.fine,
        colleges: data.colleges,
        sections: data.sections,
        schoolYears: data.schoolYears,
      });
      setIsEditModalOpen(false);
      setEventToEdit(null);
    }
  };

  const handleDeleteClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const event = events.find((ev) => ev.id === eventId);
    if (event) {
      setEventToDelete(event);
      setIsDeleteModalOpen(true);
    }
    setMenuOpenFor(null);
  };

  const handleConfirmDelete = () => {
    if (eventToDelete) {
      onDeleteEvent?.(eventToDelete.id);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      setDeleteEventConfirmChecked(false);
      // Remove last selection from localStorage if deleting selected event
      try {
        if (selectedEvent?.id && eventToDelete.id === selectedEvent.id) {
          localStorage.removeItem(LAST_SELECTED_EVENT_KEY);
        }
      } catch (e) {
        console.error(
          "Error removing last selected event from localStorage:",
          e
        );
      }
    }
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
    setDeleteEventConfirmChecked(false);
  };

  return (
    <div className="relative w-fit md:w-auto" ref={eventSelectorRef}>
      <div
        className={`${className} min-w-full xs:min-w-44 w-fit flex flex-row items-center border border-border-dark px-4 py-2 gap-2 rounded-[8px] hover:border-gray-400 hover:bg-gray-100 cursor-pointer text-sm`}
        onClick={handleToggleDropdown}
      >
        <span className={`${selectedEvent ? "text-black" : "text-zinc-500"}`}>
          <EventIcon sx={{ fontSize: "1rem" }} />
        </span>
        <input
          type="text"
          className="w-full outline-none text-sm cursor-pointer bg-transparent font-medium text-ellipsis"
          placeholder={placeholder}
          value={selectedEvent ? selectedEvent.name : ""}
          readOnly
        />
      </div>

      <EventDropdown
        events={events}
        selectedEvent={selectedEvent}
        isOpen={isOpen}
        isVisible={isDropdownVisible}
        dropdownRef={dropdownRef}
        menuRef={menuRef}
        menuOpenFor={menuOpenFor}
        currentUserRole={currentUserRole}
        canAddEvent={canAddEvent}
        canEditEvent={canEditEvent}
        canDeleteEvent={canDeleteEvent}
        onSelect={handleEventSelect}
        onMenuClick={handleMenuClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onAddEventClick={() => setIsAddEventModalOpen(true)}
        onCloseDropdown={handleCloseDropdown}
      />

      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        modalClassName="!max-w-[44rem] max-h-[85vh] overflow-y-scroll"
      >
        <AddEventForm
          onSubmit={handleAddEvent}
          onCancel={() => setIsAddEventModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEventToEdit(null);
        }}
        modalClassName="!max-w-[44rem] max-h-[85vh] overflow-y-scroll"
      >
        {eventToEdit && (
          <EditEventForm
            event={eventToEdit}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEventToEdit(null);
            }}
          />
        )}
      </Modal>

      <DeleteEventModal
        isOpen={isDeleteModalOpen}
        eventToDelete={eventToDelete}
        confirmChecked={deleteEventConfirmChecked}
        onConfirmCheckedChange={setDeleteEventConfirmChecked}
        onConfirm={handleConfirmDelete}
        onClose={handleDeleteModalClose}
      />
    </div>
  );
};
