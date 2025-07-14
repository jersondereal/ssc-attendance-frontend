import EventIcon from "@mui/icons-material/Event";
import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddEventForm } from "../../forms/AddEventForm/AddEventForm";
import { EditEventForm } from "../../forms/EditEventForm/EditEventForm";
import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  fine: number;
}

interface EventSelectorProps {
  className?: string;
  value?: Event;
  onChange?: (event: Event) => void;
  placeholder?: string;
  events: Event[];
  onAddEvent?: (eventData: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
  }) => void;
  onEditEvent?: (event: Event) => void;
  onDeleteEvent?: (eventId: string) => void;
  currentUserRole?: string; // Add this prop
}

export const EventSelector = ({
  className = "",
  value,
  onChange,
  placeholder = "Select event",
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  currentUserRole, // Add this prop
}: EventSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [deleteEventConfirmChecked, setDeleteEventConfirmChecked] =
    useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(value);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const eventSelectorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync internal state with value prop
  useEffect(() => {
    setSelectedEvent(value);
    // Auto-open dropdown when no event is selected
    if (!value) {
      setIsOpen(true);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        eventSelectorRef.current &&
        !eventSelectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
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
    onChange?.(event);
    setIsOpen(false);
  };

  const handleAddEvent = (data: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
  }) => {
    onAddEvent?.(data);
    setIsAddEventModalOpen(false);
  };

  const handleMenuClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + window.scrollY,
      left: rect.right + window.scrollX + 8, // 8px offset from the button
    });
    setMenuOpenFor(menuOpenFor === eventId ? null : eventId);
  };

  const handleEditClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullEvent = events.find((e) => e.id === event.id);
    if (fullEvent) {
      setEventToEdit(fullEvent);
      setIsEditModalOpen(true);
    }
    setMenuOpenFor(null);
  };

  const handleEditSubmit = (data: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
  }) => {
    if (eventToEdit) {
      onEditEvent?.({
        ...eventToEdit,
        name: data.title,
        date: data.event_date,
        location: data.location,
        fine: data.fine,
      });
      setIsEditModalOpen(false);
      setEventToEdit(null);
    }
  };

  const handleDeleteClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const event = events.find((e) => e.id === eventId);
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
    }
  };

  return (
    <div className="relative" ref={eventSelectorRef}>
      <div
        className={`${className} w-40 flex flex-row items-center border border-border-dark px-3 py-1 gap-2 rounded-md hover:border-gray-400 hover:bg-gray-100 cursor-pointer text-xs`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-textbox-placeholder">
          <EventIcon sx={{ fontSize: "0.9rem" }} />
        </span>
        <input
          type="text"
          className="w-full outline-none text-xs cursor-pointer bg-transparent"
          placeholder={placeholder}
          value={selectedEvent ? selectedEvent.name : ""}
          readOnly
        />
      </div>

      {/* Event Selector Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-3 mt-1 bg-white border border-border-dark rounded-md shadow-lg p-2 z-20 w-fit">
          <div className="max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-xs">
                No events found
              </div>
            ) : (
              events
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((event) => (
                  <div key={event.id} className="relative group w-56">
                    <button
                      onClick={() => handleEventSelect(event)}
                      className={`flex flex-col w-full text-left p-3 pb-2 hover:bg-gray-100 hover:bg-opacity-60 rounded-md text-xs gap-2 ${
                        selectedEvent?.id === event.id
                          ? "border border-gray-300"
                          : ""
                      }`}
                    >
                      <div className="font-semibold ">{event.name}</div>
                      <div className="flex flex-col gap-1">
                        <div className="text-gray-500 text-xs flex flex-row items-center">
                          {event.location}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-gray-500 text-xs">
                          ₱{event.fine}
                        </div>
                      </div>
                    </button>
                    {/* Hide ellipsis button for viewer */}
                    {currentUserRole !== "Viewer" && (
                      <button
                        onClick={(e) => handleMenuClick(event.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-md opacity-0 group-hover:opacity-100"
                      >
                        <Ellipsis size={16} />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
          <div className=" pt-2">
            {/* Hide Add Event button for viewer */}
            {currentUserRole !== "Viewer" && (
              <Button
                className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-black hover:bg-gray-100 rounded-md font-medium"
                label="Add Event"
                variant="secondary"
                onClick={() => {
                  setIsAddEventModalOpen(true);
                  setIsOpen(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Action Menu */}
      {menuOpenFor && (
        <div
          ref={menuRef}
          className="fixed bg-white border border-border-dark rounded-md shadow-lg z-20 w-28 p-1"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <button
            onClick={(e) =>
              handleEditClick(events.find((e) => e.id === menuOpenFor)!, e)
            }
            className="w-full rounded-md text-left px-3 py-1.5 hover:bg-zinc-100 text-xs"
          >
            Edit
          </button>
          <button
            onClick={(e) => handleDeleteClick(menuOpenFor, e)}
            className="w-full rounded-md text-left px-3 py-1.5 hover:bg-zinc-100 text-xs text-red-600"
          >
            Delete
          </button>
        </div>
      )}

      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
      >
        <AddEventForm
          onSubmit={handleAddEvent}
          onCancel={() => setIsAddEventModalOpen(false)}
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEventToEdit(null);
        }}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEventToDelete(null);
        }}
      >
        <div className="p-5 w-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Confirm to delete the event
          </h2>
          <p className="text-xs text-gray-600 mb-6">
            Are you sure you want to delete "{eventToDelete?.name}"? <br /> This
            action cannot be undone.
          </p>

          <div className="flex items-start gap-2 mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <input
              type="checkbox"
              id="delete-event-confirm"
              checked={deleteEventConfirmChecked}
              onChange={(e) => setDeleteEventConfirmChecked(e.target.checked)}
              className="mt-0.5 h-3 w-3 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label
              htmlFor="delete-event-confirm"
              className="text-xs text-red-700"
            >
              I understand that this action will permanently delete the event "
              {eventToDelete?.name}" from the database. This data cannot be
              recovered once deleted. I confirm that I have verified the
              selection and take full responsibility for this action.
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setEventToDelete(null);
                setDeleteEventConfirmChecked(false);
              }}
              label="Cancel"
              variant="secondary"
            />
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-400 !text-white !border-red-500 hover:bg-red-500 !hover:border-red-500 !hover:text-white"
              label="Delete"
              variant="danger"
              disabled={!deleteEventConfirmChecked}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
