import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DropdownSelector } from "../components/common/DropdownSelector/DropdownSelector";
import { DeleteEventModal } from "../components/common/EventSelector/DeleteEventModal";
import type { Event } from "../components/common/EventSelector/types";
import { Modal } from "../components/common/Modal/Modal";
import { EditEventForm } from "../components/forms/EditEventForm/EditEventForm";
import {
  MetricsSection,
  type RangeValue,
} from "../components/overview/MetricsSection";
import { EventCard, MetricCard } from "../components/shared";
import config from "../config";
import { RANGE_OPTIONS } from "../constants/metrics";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../contexts/ToastContext";

interface DBEvent {
  id: number;
  title: string;
  event_date: string;
  location: string;
  fine: number;
  colleges?: Event["colleges"];
  courses?: Event["colleges"];
  sections?: Event["sections"];
  school_years?: Event["schoolYears"];
}

function mapDbEventToEvent(e: DBEvent): Event {
  return {
    id: e.id.toString(),
    name: e.title,
    date: e.event_date,
    location: e.location,
    fine: e.fine,
    colleges: e.colleges ?? e.courses,
    sections: e.sections,
    schoolYears: e.school_years,
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

interface OverviewPageProps {
  currentUser: { username: string; role: string } | null;
}

export const OverviewPage = ({ currentUser }: OverviewPageProps) => {
  const { showToast } = useToast();
  const { systemSettings } = useSettings();
  const navigate = useNavigate();
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [averageAttendanceRate, setAverageAttendanceRate] = useState<
    number | null
  >(null);
  const [totalFinesOutstanding, setTotalFinesOutstanding] = useState<
    number | null
  >(null);
  const [totalFinesCollected, setTotalFinesCollected] = useState<number | null>(
    null
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleteEventConfirmChecked, setDeleteEventConfirmChecked] =
    useState(false);

  const [range, setRange] = useState<RangeValue>("last_30_days");
  const menuRef = useRef<HTMLDivElement>(null);

  // Add loading state for events (true while loading, false when loaded)
  const [eventsLoading, setEventsLoading] = useState(true);

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
    axios
      .get(`${config.API_BASE_URL}/overview/students`)
      .then((res) => setTotalStudents(res.data.totalStudents))
      .catch(() => setTotalStudents(null));
  }, []);

  useEffect(() => {
    setEventsLoading(true);
    axios
      .get(`${config.API_BASE_URL}/events`)
      .then((res) => {
        const mapped = (res.data as DBEvent[]).map(mapDbEventToEvent);
        const sorted = [...mapped].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEvents(sorted);
        setEventsLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setEventsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEvents = useCallback(() => {
    setEventsLoading(true);
    axios
      .get(`${config.API_BASE_URL}/events`)
      .then((res) => {
        const mapped = (res.data as DBEvent[]).map(mapDbEventToEvent);
        const sorted = [...mapped].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEvents(sorted);
        setEventsLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setEventsLoading(false);
      });
  }, []);

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
        fetchEvents();
      })
      .catch(() => showToast("Failed to update event", "error"));
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
    axios
      .delete(`${config.API_BASE_URL}/events/${eventToDelete.id}`)
      .then(() => {
        showToast("Event deleted successfully", "success");
        setEventToDelete(null);
        setDeleteEventConfirmChecked(false);
        fetchEvents();
      })
      .catch(() => showToast("Failed to delete event", "error"));
  };

  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/overview/attendance`, {
        params: { range },
      })
      .then((res) => setAverageAttendanceRate(res.data.averageAttendanceRate))
      .catch(() => setAverageAttendanceRate(null));
  }, [range]);

  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/overview/fines`, {
        params: { range },
      })
      .then((res) => {
        setTotalFinesOutstanding(res.data.totalFinesOutstanding);
        setTotalFinesCollected(res.data.totalFinesCollected);
      })
      .catch(() => {
        setTotalFinesOutstanding(null);
        setTotalFinesCollected(null);
      });
  }, [range]);

  const formatNumber = (value: number | null) =>
    value === null ? "--" : value.toLocaleString();

  const formatRate = (value: number | null) =>
    value === null ? "--%" : `${value.toFixed(1)}%`;

  const formatCurrency = (value: number | null) =>
    value === null ? "--" : currencyFormatter.format(value);

  const role = currentUser?.role?.toLowerCase();
  const isViewer = role === "viewer";
  const isAdmin = role === "administrator";
  const canEditEvent = isAdmin
    ? true
    : !isViewer && systemSettings.featureAccess.moderator.editEvent;
  const canDeleteEvent = isAdmin
    ? true
    : !isViewer && systemSettings.featureAccess.moderator.deleteEvent;

  return (
    <div className="w-full max-w-[70rem] mx-auto px-5 pb-20 flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500">
            Operational insights across students, events, attendance, and fines.
          </p>
        </div>
        <div className="min-w-[170px]">
          <DropdownSelector
            className="text-sm min-w-[180px]"
            value={range}
            onChange={(v) => setRange(v as RangeValue)}
            options={RANGE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              // Remove 'description' as this property does not exist on type
            }))}
            placeholder="Select range"
            name="overview-range"
            disabled={false}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-row md:flex-col gap-6 px-0! w-full md:w-fit">
          <div className="flex flex-col gap-6 w-full md:w-fit">
            <MetricsSection title="Students" containerClassName="w-full min-w-full">
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
        <div className="min-h-full w-full">
          <MetricsSection title="Events" containerClassName="min-w-full">
            <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Show skeletons while loading */}
              {eventsLoading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <EventCardSkeleton key={idx} />
                  ))
                : events.map((event) => (
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
            {!eventsLoading && events.length === 0 && (
              <p className="text-sm text-gray-500 py-4">No events yet.</p>
            )}
          </MetricsSection>
        </div>
      </div>

      <Modal isOpen={!!eventToEdit} onClose={() => setEventToEdit(null)}>
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
