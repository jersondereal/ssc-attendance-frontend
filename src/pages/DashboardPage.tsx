import {
  CalendarDays,
  ChevronRight,
  HandCoins,
  MapPin,
  Users,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DropdownSelector } from "../components/common/DropdownSelector/DropdownSelector";
import type { RangeValue } from "../components/overview/MetricsSection";
import { MetricCard } from "../components/shared";
import { RANGE_OPTIONS } from "../constants/metrics";
import { useAuthStore } from "../stores/useAuthStore";
import { useEventsStore } from "../stores/useEventsStore";
import { useOverviewStore } from "../stores/useOverviewStore";
import type { DBEvent } from "../stores/types";

interface EventListCardProps {
  title: string;
  events: DBEvent[];
  emptyMessage: string;
  onEventClick: (id: number) => void;
  onViewAll: () => void;
  showTime?: boolean;
}

const formatEventTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

function EventListCard({
  title,
  events,
  emptyMessage,
  onEventClick,
  onViewAll,
  showTime = false,
}: EventListCardProps) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between border-b border-gray-200 -mx-4 px-4 pb-3 mb-3">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
        >
          View all
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-200">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event.id)}
              className="flex items-center justify-between gap-3 py-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {event.title}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
              <div className="shrink-0 text-xs font-medium text-gray-500">
                {showTime
                  ? formatEventTime(event.event_time)
                  : new Date(event.event_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const DashboardPage = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();

  const totalStudents = useOverviewStore((s) => s.totalStudents);
  const totalEvents = useOverviewStore((s) => s.totalEvents);
  const averageAttendanceRate = useOverviewStore(
    (s) => s.averageAttendanceRate
  );
  const totalFinesOutstanding = useOverviewStore(
    (s) => s.totalFinesOutstanding
  );
  const totalFinesCollected = useOverviewStore((s) => s.totalFinesCollected);
  const range = useOverviewStore((s) => s.range);
  const setRange = useOverviewStore((s) => s.setRange);
  const fetchOverviewMetrics = useOverviewStore((s) => s.fetchOverviewMetrics);

  const eventsRaw = useEventsStore((s) => s.events);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);

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
    fetchOverviewMetrics();
  }, [fetchOverviewMetrics, range]);

  useEffect(() => {
    if (eventsRaw.length === 0) fetchEvents();
  }, [eventsRaw.length, fetchEvents]);

  // Events happening today.
  const todaysEvents = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    return [...eventsRaw]
      .filter((e) => {
        const d = new Date(e.event_date);
        return d >= startOfToday && d < startOfTomorrow;
      })
      .sort((a, b) => (a.event_time ?? "").localeCompare(b.event_time ?? ""))
      .slice(0, 5);
  }, [eventsRaw]);

  // Next 5 events after today, soonest first.
  const upcomingEvents = useMemo(() => {
    const startOfTomorrow = new Date();
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    return [...eventsRaw]
      .filter((e) => new Date(e.event_date) >= startOfTomorrow)
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
      .slice(0, 5);
  }, [eventsRaw]);

  const formatNumber = (value: number | null) =>
    value === null ? "--" : value.toLocaleString();

  const formatRate = (value: number | null) =>
    value === null ? "--%" : `${value.toFixed(1)}%`;

  const formatCurrency = (value: number | null) =>
    value === null ? "--" : currencyFormatter.format(value);

  const role = currentUser?.role?.toLowerCase();
  const isViewer = role === "viewer";

  return (
    <div className="w-full max-w-[70rem] mx-auto px-5 md:px-10 pt-10 pb-10 flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        {!isViewer && (
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
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Registered students"
          value={formatNumber(totalStudents)}
          icon={<Users className="size-5" />}
          className="min-h-[150px]"
          onViewAll={() => navigate("/students")}
        />
        <MetricCard
          label="Total events"
          value={formatNumber(totalEvents)}
          icon={<CalendarDays className="size-5" />}
          className="min-h-[150px]"
        />
        {!isViewer && (
          <>
            <MetricCard
              label="Avg. attendance rate"
              value={formatRate(averageAttendanceRate)}
              icon={<UserCheck className="size-5" />}
              className="min-h-[150px]"
            />
            <MetricCard
              label="Total fines outstanding"
              value={formatCurrency(totalFinesOutstanding)}
              icon={<Wallet className="size-5" />}
              className="min-h-[150px]"
            />
            <MetricCard
              label="Total fines collected"
              value={formatCurrency(totalFinesCollected)}
              icon={<HandCoins className="size-5" />}
              className="min-h-[150px]"
            />
          </>
        )}
      </div>

      <EventListCard
        title="Happening Today"
        events={todaysEvents}
        emptyMessage="No events today."
        onEventClick={(id) => navigate(`/events/${id}`)}
        onViewAll={() => navigate("/events")}
        showTime
      />

      <EventListCard
        title="Upcoming Events"
        events={upcomingEvents}
        emptyMessage="No upcoming events."
        onEventClick={(id) => navigate(`/events/${id}`)}
        onViewAll={() => navigate("/events")}
      />
    </div>
  );
};
