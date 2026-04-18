import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button/Button";
import { DropdownSelector } from "../components/common/DropdownSelector/DropdownSelector";
import { DeleteEventModal } from "../components/common/EventSelector/DeleteEventModal";
import type {
  AddEventData,
  Event,
} from "../components/common/EventSelector/types";
import { Modal } from "../components/common/Modal/Modal";
import { AddEventForm } from "../components/forms/AddEventForm/AddEventForm";
import { EditEventForm } from "../components/forms/EditEventForm/EditEventForm";
import {
  MetricsSection,
  type RangeValue,
} from "../components/overview/MetricsSection";
import { EventCard, MetricCard } from "../components/shared";
import config from "../config";
import { RANGE_OPTIONS } from "../constants/metrics";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useToast } from "../contexts/ToastContext";
import type { DBEvent } from "../stores/types";
import { useAuthStore } from "../stores/useAuthStore";
import { useEventsStore } from "../stores/useEventsStore";
import { useOverviewStore } from "../stores/useOverviewStore";

function mapDbEventToEvent(e: DBEvent): Event {
  return {
    id: e.id.toString(),
    name: e.title,
    date: e.event_date,
    location: e.location,
    fine: e.fine,
    colleges: e.colleges ?? e.courses,
    sections: e.sections as Event["sections"],
    schoolYears: e.school_years as Event["schoolYears"],
  };
}

// Simple event card skeleton (2 column grid card placeholder)
function EventCardSkeleton() {
  return (
    <div className="relative w-full border border-border-dark rounded-[10px] p-4 bg-gray-50 animate-pulse flex flex-col gap-2 min-h-[125px]">
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

export const OverviewPage = () => {
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

  const totalStudents = useOverviewStore((s) => s.totalStudents);
  const averageAttendanceRate = useOverviewStore(
    (s) => s.averageAttendanceRate
  );
  const totalFinesOutstanding = useOverviewStore(
    (s) => s.totalFinesOutstanding
  );
  const totalFinesCollected = useOverviewStore((s) => s.totalFinesCollected);
  const range = useOverviewStore((s) => s.range);
  const setRange = useOverviewStore((s) => s.setRange);
  const visibleEventCount = useOverviewStore((s) => s.visibleEventCount);
  const setVisibleEventCount = useOverviewStore((s) => s.setVisibleEventCount);
  const eventToEdit = useOverviewStore((s) => s.eventToEdit);
  const setEventToEdit = useOverviewStore((s) => s.setEventToEdit);
  const eventToDelete = useOverviewStore((s) => s.eventToDelete);
  const setEventToDelete = useOverviewStore((s) => s.setEventToDelete);
  const setDeleteEventConfirmChecked = useOverviewStore(
    (s) => s.setDeleteEventConfirmChecked
  );
  const menuOpenFor = useOverviewStore((s) => s.menuOpenFor);
  const setMenuOpenFor = useOverviewStore((s) => s.setMenuOpenFor);
  const isAddEventModalOpen = useOverviewStore(
    (s) => s.isAddEventModalOpen
  );
  const setIsAddEventModalOpen = useOverviewStore(
    (s) => s.setIsAddEventModalOpen
  );
  const deleteEventConfirmChecked = useOverviewStore(
    (s) => s.deleteEventConfirmChecked
  );
  const fetchOverviewMetrics = useOverviewStore(
    (s) => s.fetchOverviewMetrics
  );

  const events = useMemo(
    () =>
      [...eventsRaw]
        .map(mapDbEventToEvent)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [eventsRaw]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    if (eventsRaw.length === 0) fetchEvents();
  }, [eventsRaw.length, fetchEvents]);

  useEffect(() => {
    fetchOverviewMetrics();
  }, [fetchOverviewMetrics, range]);

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
        "success"
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

  const formatNumber = (value: number | null) =>
    value === null ? "--" : value.toLocaleString();

  const formatRate = (value: number | null) =>
    value === null ? "--%" : `${value.toFixed(1)}%`;

  const formatCurrency = (value: number | null) =>
    value === null ? "--" : currencyFormatter.format(value);

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

  const eventsSection = (
    <div className="flex flex-col w-full">
      <div className="w-full">
        <MetricsSection title="Events" containerClassName="min-w-full">
          <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2">
            {eventsLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <EventCardSkeleton key={idx} />
                ))
              : events.slice(0, visibleEventCount).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isMenuOpen={menuOpenFor === event.id}
                    onMenuClick={(e) => handleMenuClick(event.id, e)}
                    onEditClick={(e) => handleEditClick(event, e)}
                    onDeleteClick={(e) => handleDeleteClick(event.id, e)}
                    onCardClick={() => {
                      navigate("/attendance", {
                        state: { eventId: event.id },
                      });
                      window.scrollTo(0, 0);
                    }}
                    menuRef={menuRef}
                    canEdit={canEditEvent}
                    canDelete={canDeleteEvent}
                  />
                ))}
          </div>
        </MetricsSection>
      </div>
      {!eventsLoading && events.length === 0 && (
        <p className="text-sm text-gray-500 py-4">No events yet.</p>
      )}
      {!eventsLoading && events.length > visibleEventCount && (
        <button
          type="button"
          onClick={() =>
            setVisibleEventCount((prev) => Math.min(prev + 6, events.length))
          }
          className="w-full mt-4 rounded-[10px] border border-border-dark bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Show more
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[70rem] mx-auto px-5 pt-5 pb-10 flex flex-col gap-6">
      {!isViewer && (
        <>
          <div className="flex flex-wrap justify-between gap-3 items-center">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-gray-900">Overview</h1>
              <p className="text-sm text-gray-500">
                Operational insights across students, events, attendance, and
                fines.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-[170px]">
                <DropdownSelector
                  className="text-sm min-w-[180px]"
                  value={range}
                  onChange={(v) => setRange(v as RangeValue)}
                  options={RANGE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  placeholder="Select range"
                  name="overview-range"
                  disabled={false}
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
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-row md:flex-col gap-6 px-0! w-full md:w-fit">
              <div className="flex flex-col gap-6 w-full md:w-fit">
                <MetricsSection
                  title="Students"
                  containerClassName="w-full min-w-full"
                >
                  <MetricCard
                    label="Total students"
                    value={formatNumber(totalStudents)}
                  />
                </MetricsSection>

                <MetricsSection title="Attendance">
                  <MetricCard
                    label="Average attendance rate"
                    value={formatRate(averageAttendanceRate)}
                  />
                </MetricsSection>
              </div>
              <div className="flex flex-col gap-6 w-full md:w-fit">
                <MetricsSection title="Fines" direction="column">
                  <MetricCard
                    label="Total fines outstanding"
                    value={formatCurrency(totalFinesOutstanding)}
                  />
                  <MetricCard
                    label="Total fines collected"
                    value={formatCurrency(totalFinesCollected)}
                  />
                </MetricsSection>
              </div>
            </div>
            <div className="min-h-full w-full">{eventsSection}</div>
          </div>
        </>
      )}
      {isViewer && eventsSection}

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
