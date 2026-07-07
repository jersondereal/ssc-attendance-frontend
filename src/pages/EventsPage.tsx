import axios from "axios";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button/Button";
import { DeleteEventModal } from "../components/common/EventSelector/DeleteEventModal";
import type {
  AddEventData,
  Event,
} from "../components/common/EventSelector/types";
import { Modal } from "../components/common/Modal/Modal";
import { AddEventForm } from "../components/forms/AddEventForm/AddEventForm";
import { EditEventForm } from "../components/forms/EditEventForm/EditEventForm";
import { MetricsSection } from "../components/overview/MetricsSection";
import { EventCard } from "../components/shared";
import config from "../config";
import { useToast } from "../contexts/ToastContext";
import type { DBEvent } from "../stores/types";
import { useAuthStore } from "../stores/useAuthStore";
import { useEventsStore } from "../stores/useEventsStore";
import { useOverviewStore } from "../stores/useOverviewStore";
import { useSettingsStore } from "../stores/useSettingsStore";

function mapDbEventToEvent(e: DBEvent): Event {
  return {
    id: e.id.toString(),
    name: e.title,
    date: e.event_date,
    time: e.event_time,
    location: e.location,
    fine: e.fine,
    colleges: e.colleges ?? e.courses,
    sections: e.sections as Event["sections"],
    schoolYears: e.school_years as Event["schoolYears"],
  };
}

// Simple event card skeleton (grid card placeholder)
function EventCardSkeleton() {
  return (
    <div className="relative w-full border border-gray-300 rounded-[10px] p-4 bg-white animate-pulse flex flex-col gap-2 min-h-[125px]">
      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      <div className="h-3 w-1/3 bg-gray-200 rounded mt-2"></div>
      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
      <div className="h-3 w-16 bg-gray-200 rounded"></div>
      <div className="flex flex-row gap-2 mt-2">
        <div className="h-4 w-10 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export const EventsPage = () => {
  const { showToast } = useToast();
  const systemSettings = useSettingsStore((s) => s.systemSettings);
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const eventsRaw = useEventsStore((s) => s.events);
  const eventsLoading = useEventsStore((s) => s.loading);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const removeEventFromStore = useEventsStore((s) => s.removeEvent);
  const addEventToStore = useEventsStore((s) => s.addEvent);

  const visibleEventCount = useOverviewStore((s) => s.visibleEventCount);
  const setVisibleEventCount = useOverviewStore((s) => s.setVisibleEventCount);
  const eventToEdit = useOverviewStore((s) => s.eventToEdit);
  const setEventToEdit = useOverviewStore((s) => s.setEventToEdit);
  const eventToDelete = useOverviewStore((s) => s.eventToDelete);
  const setEventToDelete = useOverviewStore((s) => s.setEventToDelete);
  const setDeleteEventConfirmChecked = useOverviewStore(
    (s) => s.setDeleteEventConfirmChecked,
  );
  const menuOpenFor = useOverviewStore((s) => s.menuOpenFor);
  const setMenuOpenFor = useOverviewStore((s) => s.setMenuOpenFor);
  const isAddEventModalOpen = useOverviewStore((s) => s.isAddEventModalOpen);
  const setIsAddEventModalOpen = useOverviewStore(
    (s) => s.setIsAddEventModalOpen,
  );
  const deleteEventConfirmChecked = useOverviewStore(
    (s) => s.deleteEventConfirmChecked,
  );

  const [eventSearch, setEventSearch] = useState("");

  const events = useMemo(
    () =>
      [...eventsRaw]
        .map(mapDbEventToEvent)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [eventsRaw],
  );

  // Filter events by the search query (matches title or location).
  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q),
    );
  }, [events, eventSearch]);

  // Group the currently visible events (already sorted newest-first) into
  // month buckets so the grid can show a label per month.
  const eventsByMonth = useMemo(() => {
    const groups: { key: string; label: string; events: Event[] }[] = [];
    const indexByKey = new Map<string, number>();
    for (const event of filteredEvents.slice(0, visibleEventCount)) {
      const date = new Date(event.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      let idx = indexByKey.get(key);
      if (idx === undefined) {
        idx = groups.length;
        indexByKey.set(key, idx);
        groups.push({ key, label, events: [] });
      }
      groups[idx].events.push(event);
    }
    return groups;
  }, [filteredEvents, visibleEventCount]);

  useEffect(() => {
    if (eventsRaw.length === 0) fetchEvents();
  }, [eventsRaw.length, fetchEvents]);

  useEffect(() => {
    setVisibleEventCount(6);
  }, [events.length, setVisibleEventCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setMenuOpenFor]);

  const handleMenuClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenFor(menuOpenFor === eventId ? null : eventId);
  };

  const handleEditClick = (event: Event, e: React.MouseEvent) => {
    if (!canEditEvent) return;
    e.stopPropagation();
    setEventToEdit(event);
    setMenuOpenFor(null);
  };

  // Modified: on event update, reload page.
  const handleEditSubmit = (data: {
    title: string;
    event_date: string;
    event_time: string;
    location: string;
    fine: number;
    colleges: Event["colleges"];
    sections: Event["sections"];
    schoolYears: Event["schoolYears"];
  }) => {
    if (!eventToEdit) return;
    axios
      .put(`${config.API_BASE_URL}/events/${eventToEdit.id}`, {
        title: data.title,
        event_date: data.event_date,
        event_time: data.event_time,
        location: data.location,
        fine: data.fine,
        colleges: data.colleges,
        sections: data.sections,
        schoolYears: data.schoolYears,
      })
      .then(() => {
        showToast("Event updated successfully", "success");
        setEventToEdit(null);
        // Instead of updating in store, force page reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch(() => showToast("Failed to update event", "error"));
  };

  const handleAddEvent = async (eventData: AddEventData) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/events/`, {
        ...eventData,
        colleges: eventData.colleges,
      });
      const newEvent = response.data as DBEvent;
      addEventToStore(newEvent);
      showToast(
        `Event "${mapDbEventToEvent(newEvent).name}" created successfully`,
        "success",
      );
      setIsAddEventModalOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
      showToast("Failed to create event", "error");
    }
  };

  const handleDeleteClick = (eventId: string, e: React.MouseEvent) => {
    if (!canDeleteEvent) return;
    e.stopPropagation();
    const event = events.find((ev) => ev.id === eventId);
    if (event) {
      setEventToDelete(event);
      setMenuOpenFor(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!eventToDelete) return;
    const id = eventToDelete.id;
    axios
      .delete(`${config.API_BASE_URL}/events/${id}`)
      .then(() => {
        showToast("Event deleted successfully", "success");
        setEventToDelete(null);
        setDeleteEventConfirmChecked(false);
        removeEventFromStore(id);
      })
      .catch(() => showToast("Failed to delete event", "error"));
  };

  const role = currentUser?.role?.toLowerCase();
  const isViewer = role === "viewer";
  const isAdmin = role === "administrator";
  const canAddEvent = isAdmin
    ? true
    : !isViewer && systemSettings.featureAccess.moderator.addEvent;
  const canEditEvent = isAdmin
    ? true
    : !isViewer && systemSettings.featureAccess.moderator.editEvent;
  const canDeleteEvent = isAdmin
    ? true
    : !isViewer && systemSettings.featureAccess.moderator.deleteEvent;

  return (
    <div className="w-full max-w-[70rem] mx-auto px-5 md:px-10 pt-10 pb-10 flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900">Events</h1>
        {!isViewer && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events"
                className="w-40 rounded-[8px] border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none sm:w-56"
              />
            </div>
            {canAddEvent && (
              <Button
                type="button"
                label="Add Event"
                variant="primary"
                className="py-2 px-4 text-sm"
                onClick={() => setIsAddEventModalOpen(true)}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col w-full">
        <div className="w-full">
          <MetricsSection title="" containerClassName="min-w-full">
            {eventsLoading ? (
              <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <EventCardSkeleton key={idx} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                {eventsByMonth.map((group) => (
                  <div key={group.key} className="flex flex-col gap-3">
                    <h3 className="text-xs text-gray-400">{group.label}</h3>
                    <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {group.events.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isMenuOpen={menuOpenFor === event.id}
                          onMenuClick={(e) => handleMenuClick(event.id, e)}
                          onEditClick={(e) => handleEditClick(event, e)}
                          onDeleteClick={(e) => handleDeleteClick(event.id, e)}
                          onCardClick={() => {
                            navigate(`/events/${event.id}`);
                            window.scrollTo(0, 0);
                          }}
                          menuRef={menuRef}
                          canEdit={canEditEvent}
                          canDelete={canDeleteEvent}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MetricsSection>
        </div>
        {!eventsLoading && filteredEvents.length === 0 && (
          <p className="text-sm text-gray-500 py-4">
            {eventSearch.trim() ? "No events found." : "No events yet."}
          </p>
        )}
        {!eventsLoading && filteredEvents.length > visibleEventCount && (
          <button
            type="button"
            onClick={() =>
              setVisibleEventCount((prev) =>
                Math.min(prev + 6, filteredEvents.length),
              )
            }
            className="w-fit px-6 mx-auto mt-8 rounded-[10px] border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Show more
          </button>
        )}
      </div>

      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        modalClassName="!max-w-[44rem] max-h-[85vh] overflow-y-auto md:overflow-y-visible"
      >
        <AddEventForm
          onSubmit={handleAddEvent}
          onCancel={() => setIsAddEventModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!eventToEdit}
        onClose={() => setEventToEdit(null)}
        modalClassName="!max-w-[44rem] max-h-[85vh] overflow-y-auto md:overflow-y-visible"
      >
        {eventToEdit && (
          <EditEventForm
            event={eventToEdit}
            onSubmit={handleEditSubmit}
            onCancel={() => setEventToEdit(null)}
          />
        )}
      </Modal>

      <DeleteEventModal
        isOpen={!!eventToDelete}
        eventToDelete={eventToDelete}
        confirmChecked={deleteEventConfirmChecked}
        onConfirmCheckedChange={setDeleteEventConfirmChecked}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setEventToDelete(null);
          setDeleteEventConfirmChecked(false);
        }}
      />
    </div>
  );
};
