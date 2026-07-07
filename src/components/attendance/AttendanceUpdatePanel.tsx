import { UserRound } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import type { AttendanceHistoryEntry, AttendanceRecord } from "../../stores/types";

interface AttendanceUpdatePanelProps {
  record: AttendanceRecord | null;
  profileImageUrl?: string | null;
  updatedAt: number | null;
  history?: AttendanceHistoryEntry[];
}

const SHEET_PEEK_HEIGHT = 64;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "present":
      return "text-sscThemeIcon bg-sscThemeLight";
    case "absent":
      return "text-gray-600 bg-gray-100";
    case "excused":
      return "text-orange-700 bg-orange-50";
    default:
      return "text-gray-700 bg-gray-50";
  }
}

function getStatusTextColor(status: string) {
  switch (status.toLowerCase()) {
    case "present":
      return "text-sscThemeIcon";
    case "absent":
      return "text-gray-600";
    case "excused":
      return "text-orange-700";
    default:
      return "text-gray-700";
  }
}

function AttendanceHistoryCard({ history }: { history: AttendanceHistoryEntry[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-gray-200 bg-white p-5 pr-0">
      <h2 className="text-sm font-semibold text-gray-800">Attendance History</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">No history yet.</p>
      ) : (
        <div className="flex max-h-[234px] flex-col overflow-y-auto pr-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 border-b border-gray-200 py-2 last:border-0"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-gray-900">
                  {entry.studentName}
                </div>
                <div className="text-[11px] text-gray-400">{entry.studentId}</div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span>{entry.previousStatus ?? "New"}</span>
                  <span>→</span>
                  <span className={`font-medium ${getStatusTextColor(entry.newStatus)}`}>
                    {entry.newStatus}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
                {new Date(entry.changedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentInfoGrid({ record }: { record: AttendanceRecord }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-gray-150 border-t border-gray-150 pt-3 text-center">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400">
          College
        </div>
        <div className="mt-1 text-xs font-medium text-gray-800">
          {record.college || "—"}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400">
          Year
        </div>
        <div className="mt-1 text-xs font-medium text-gray-800">
          {record.year || "—"}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400">
          Section
        </div>
        <div className="mt-1 text-xs font-medium text-gray-800">
          {record.section || "—"}
        </div>
      </div>
    </div>
  );
}

function ProfilePhoto({
  record,
  profileImageUrl,
  className,
  iconClassName,
  enablePreview = false,
}: {
  record: AttendanceRecord;
  profileImageUrl?: string | null;
  className: string;
  iconClassName: string;
  enablePreview?: boolean;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const canPreview = enablePreview && !!profileImageUrl;

  return (
    <>
      <div
        className={`grid shrink-0 place-items-center overflow-hidden rounded-[10px] border border-gray-300 bg-gray-100 text-gray-500 ${className} ${
          canPreview ? "cursor-pointer" : ""
        }`}
        onClick={canPreview ? () => setIsPreviewOpen(true) : undefined}
      >
        {profileImageUrl ? (
          <img
            key={record.studentId}
            src={profileImageUrl}
            alt={record.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound className={iconClassName} />
        )}
      </div>

      {canPreview &&
        isPreviewOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setIsPreviewOpen(false)}
          >
            <img
              src={profileImageUrl ?? undefined}
              alt={record.name}
              className="max-h-full max-w-full rounded-[10px] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </>
  );
}

export function LastUpdatedCard({
  record,
  profileImageUrl,
  updatedAt,
  className = "",
}: {
  record: AttendanceRecord | null;
  profileImageUrl?: string | null;
  updatedAt: number | null;
  className?: string;
}) {
  return (
    <aside
      className={`flex flex-col gap-4 rounded-[10px] border border-gray-200 bg-white p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Last Updated</h2>
        {updatedAt && (
          <span className="text-xs text-gray-500">
            {new Date(updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {!record ? (
        <p className="text-sm text-gray-500">No attendance changes yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <ProfilePhoto
              record={record}
              profileImageUrl={profileImageUrl}
              className="size-28"
              iconClassName="size-10"
              enablePreview
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">
                {record.name}
              </div>
              <div className="text-xs text-gray-500">{record.studentId}</div>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(
                record.status
              )}`}
            >
              {record.status}
            </span>
          </div>

          <StudentInfoGrid record={record} />
        </div>
      )}
    </aside>
  );
}

export function AttendanceUpdatePanel({
  record,
  profileImageUrl,
  updatedAt,
  history = [],
}: AttendanceUpdatePanelProps) {
  return (
    <>
      <div className="hidden mt-[46px] lg:flex w-full max-w-60 shrink-0 flex-col gap-4 sticky top-4 self-start">
        <LastUpdatedCard
          record={record}
          profileImageUrl={profileImageUrl}
          updatedAt={updatedAt}
        />

        <AttendanceHistoryCard history={history} />
      </div>

      <AttendanceUpdateSheet
        record={record}
        profileImageUrl={profileImageUrl}
        updatedAt={updatedAt}
      />
    </>
  );
}

function AttendanceUpdateSheet({
  record,
  profileImageUrl,
  updatedAt,
}: AttendanceUpdatePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    setSheetHeight(el.getBoundingClientRect().height);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSheetHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [record]);

  if (!record) return null;

  const collapsedOffset = Math.max(sheetHeight - SHEET_PEEK_HEIGHT, 0);
  const baseOffset = isExpanded ? 0 : collapsedOffset;
  const translateY = clamp(baseOffset + dragY, 0, collapsedOffset);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    setDragY(e.clientY - dragStartY.current);
  };

  const handlePointerUp = () => {
    if (dragStartY.current === null) return;
    setIsExpanded(clamp(baseOffset + dragY, 0, collapsedOffset) < collapsedOffset / 2);
    dragStartY.current = null;
    setIsDragging(false);
    setDragY(0);
  };

  return (
    <div
      ref={sheetRef}
      className="lg:hidden fixed inset-x-4 bottom-0 z-40 rounded-t-[16px] border border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)] select-none"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? "none" : "transform 250ms ease",
        touchAction: "none",
      }}
    >
      <div
        className="flex cursor-pointer flex-col items-center gap-1 pt-2 pb-1"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (!isDragging) setIsExpanded((prev) => !prev);
        }}
      >
        <span className="h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="flex w-full items-center gap-2 px-4 py-2">
          <ProfilePhoto
            record={record}
            profileImageUrl={profileImageUrl}
            className="size-8 rounded-full!"
            iconClassName="size-4"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-gray-900">
              {record.name}
            </div>
            <div className="text-[10px] text-gray-500">Last Updated</div>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusClass(
              record.status
            )}`}
          >
            {record.status}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-6 pt-1">
        <div className="flex flex-col items-center gap-3 text-center">
          <ProfilePhoto
            record={record}
            profileImageUrl={profileImageUrl}
            className="size-28"
            iconClassName="size-10"
            enablePreview
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">
              {record.name}
            </div>
            <div className="text-xs text-gray-500">{record.studentId}</div>
          </div>
          {updatedAt && (
            <span className="text-xs text-gray-400">
              {new Date(updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <StudentInfoGrid record={record} />
      </div>
    </div>
  );
}
