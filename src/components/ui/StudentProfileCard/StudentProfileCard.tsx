import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import axios from "axios";
import html2canvas from "html2canvas";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import config from "../../../config";
import Checkbox from "../../common/Checkbox/Checkbox";
import { Modal } from "../../common/Modal/Modal";
import type { StudentRecord } from "../../common/Table/Table";
import { StudentQRCard } from "../StudentQRCard/StudentQRCard";
import { MetricCard } from "../../shared/MetricCard/MetricCard";
import { useToast } from "../../../contexts/ToastContext";

interface AttendanceRecord {
  event_id: number;
  event_title: string;
  event_date: string;
  location: string;
  status: string;
  check_in_time: string;
  attendance_created_at: string;
}

interface MetricsData {
  student: {
    student_id: string;
    name: string;
    college?: string;
    course?: string;
    year: string;
    section: string;
  };
  summary: {
    totalEvents: number;
    present: number;
    absent: number;
    excused: number;
    attendanceRate: string;
  };
  attendanceRecords: AttendanceRecord[];
}

interface StudentFine {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  amount: number;
  isPaid: boolean;
}

interface FineApiResponse {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  amount: string;
  is_paid: boolean;
  status: string;
  student_id: string;
}

interface StudentProfileCardProps {
  studentData: StudentRecord;
  onClose: () => void;
  currentUserRole?: string;
}

/** School year is July 1 to April 30. Returns [start, end] as Date at midnight. */
function getCurrentSchoolYearRange(): { start: Date; end: Date } {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  // July (6) through next April (3 of next year)
  if (month >= 6) {
    return {
      start: new Date(year, 6, 1), // July 1
      end: new Date(year + 1, 3, 30, 23, 59, 59, 999), // April 30 end of day
    };
  }
  // Jan (0) through June (5): school year started previous July
  return {
    start: new Date(year - 1, 6, 1), // July 1 previous year
    end: new Date(year, 3, 30, 23, 59, 59, 999), // April 30 current year
  };
}

export function StudentProfileCard({
  studentData,
  onClose,
  currentUserRole,
}: StudentProfileCardProps) {
  const { showToast } = useToast();
  const qrCardRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [fines, setFines] = useState<StudentFine[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingFines, setLoadingFines] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [finesError, setFinesError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [finesConfirmChecked, setFinesConfirmChecked] = useState(false);
  const [showIndividualConfirmModal, setShowIndividualConfirmModal] =
    useState(false);
  const [individualConfirmChecked, setIndividualConfirmChecked] =
    useState(false);
  const [pendingFine, setPendingFine] = useState<StudentFine | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Pick<StudentFine, "eventTitle" | "amount" | "eventDate">;
    direction: "asc" | "desc";
  }>({ key: "eventDate", direction: "desc" });

  // Add school year start and end for use in the profile (as Date objects and formatted strings)
  const { start: schoolYearStartDate, end: schoolYearEndDate } = getCurrentSchoolYearRange();
  const schoolYearStart = schoolYearStartDate.getFullYear();
  const schoolYearEnd = schoolYearEndDate.getFullYear();

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const response = await axios.get<MetricsData>(
        `${config.API_BASE_URL}/students/${studentData.studentId}/metrics`
      );
      setMetrics(response.data);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setMetricsError("Failed to load metrics");
    } finally {
      setLoadingMetrics(false);
    }
  }, [studentData.studentId]);

  const fetchFines = useCallback(async () => {
    setLoadingFines(true);
    setFinesError(null);
    try {
      const response = await axios.get<FineApiResponse[]>(
        `${config.API_BASE_URL}/fines/student/${studentData.studentId}`
      );
      const { start: schoolYearStart, end: schoolYearEnd } =
        getCurrentSchoolYearRange();
      const transformed = response.data
        .map((f: FineApiResponse) => ({
          id: f.id,
          eventId: f.event_id,
          eventTitle: f.event_title,
          eventDate: f.event_date,
          amount: parseFloat(f.amount),
          isPaid: f.is_paid,
        }))
        .filter((fine: { eventDate: string }) => {
          const eventDate = new Date(fine.eventDate);
          if (isNaN(eventDate.getTime())) return false;
          return eventDate >= schoolYearStart && eventDate <= schoolYearEnd;
        });
      setFines(transformed);
    } catch (err) {
      console.error("Error fetching fines:", err);
      setFinesError("Failed to load fines");
    } finally {
      setLoadingFines(false);
    }
  }, [studentData.studentId]);

  useEffect(() => {
    fetchMetrics();
    fetchFines();
  }, [fetchMetrics, fetchFines]);

  const handleSort = (
    key: keyof Pick<StudentFine, "eventTitle" | "amount" | "eventDate">
  ) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCheckboxChange = (fine: StudentFine) => {
    if (fine.isPaid) return;
    setPendingFine(fine);
    setShowIndividualConfirmModal(true);
  };

  const handleSelectAll = () => {
    if (fines.every((f) => f.isPaid)) return;
    setShowConfirmModal(true);
  };

  const confirmSelectAll = async () => {
    try {
      await Promise.all(
        fines.map((fine) =>
          axios.put(
            `${config.API_BASE_URL}/fines/student/${studentData.studentId}/event/${fine.eventId}`,
            { isPaid: true }
          )
        )
      );
      setFines((prev) => prev.map((f) => ({ ...f, isPaid: true })));
    } catch (err) {
      console.error("Error updating fines:", err);
    } finally {
      setShowConfirmModal(false);
      setFinesConfirmChecked(false);
    }
  };

  const confirmIndividualFine = async () => {
    if (!pendingFine) return;
    try {
      await axios.put(
        `${config.API_BASE_URL}/fines/student/${studentData.studentId}/event/${pendingFine.eventId}`,
        { isPaid: true }
      );
      setFines((prev) =>
        prev.map((f) => (f.id === pendingFine.id ? { ...f, isPaid: true } : f))
      );
    } catch (err) {
      console.error("Error updating fine:", err);
    } finally {
      setShowIndividualConfirmModal(false);
      setIndividualConfirmChecked(false);
      setPendingFine(null);
    }
  };

  const sortedFines = [...fines].sort((a, b) => {
    let aVal: string | number = a[sortConfig.key];
    let bVal: string | number = b[sortConfig.key];
    if (sortConfig.key === "eventDate") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalUnpaidFines = fines
    .filter((f) => !f.isPaid)
    .reduce((sum, f) => sum + f.amount, 0)
    .toFixed(2);

  const loading = loadingMetrics || loadingFines;
  const canEditFines = currentUserRole && currentUserRole !== "Viewer";

  if (loading) {
    return (
      <div className="p-8 min-w-[20rem]">
        <div className="flex items-center justify-center py-12 text-gray-700 font-medium">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="student-profile-card" className="w-[90vw] md:w-[28rem] max-h-[85vh] overflow-y-auto rounded-[20px] border border-gray-200 bg-white shadow-lg relative">
        {/* Header row: close and profile */}
        <div className="sticky top-0 z-10 flex flex-row items-start justify-between bg-white rounded-t-xl p-8 pb-5">
          {/* Profile header – no profile pic */}
          <div className="flex-1 min-w-0 flex flex-col items-start gap-2">
            {(studentData.profileImageUrl && currentUserRole !== "Viewer") && (
              <div className="size-32 bg-gray-100 rounded-[10px] border border-gray-300 grid place-items-center overflow-hidden">
                <img src={studentData.profileImageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight break-words font-serif">
              {studentData.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-bold">
              <span>{studentData.studentId}</span>
              <span>{studentData.college}</span>
              <span>
                {studentData.year}-{studentData.section}
              </span>
            </div>
          </div>
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-700 font-medium hover:bg-gray-100 hover:text-gray-700 shrink-0 self-start"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Fines */}
        <div className="px-8 pt-0">
          <h3 className="text-xs text-gray-900 font-semibold mb-3">Fines</h3>
          {finesError ? (
            <p className="text-sm text-red-500">{finesError}</p>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {canEditFines && (
                          <th className="w-8 py-2 pl-2">
                            <Checkbox
                              checked={
                                fines.length > 0 && fines.every((f) => f.isPaid)
                              }
                              onChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th
                          className="px-2 py-2 text-left font-semibold text-gray-800 cursor-pointer"
                          onClick={() => handleSort("eventTitle")}
                        >
                          Event{" "}
                          {sortConfig.key === "eventTitle" &&
                            (sortConfig.direction === "asc" ? (
                              <SouthIcon sx={{ fontSize: 12 }} />
                            ) : (
                              <NorthIcon sx={{ fontSize: 12 }} />
                            ))}
                        </th>
                        <th
                          className="px-2 py-2 text-left font-semibold text-gray-800 cursor-pointer"
                          onClick={() => handleSort("amount")}
                        >
                          Fine{" "}
                          {sortConfig.key === "amount" &&
                            (sortConfig.direction === "asc" ? (
                              <SouthIcon sx={{ fontSize: 12 }} />
                            ) : (
                              <NorthIcon sx={{ fontSize: 12 }} />
                            ))}
                        </th>
                        <th
                          className="px-2 py-2 text-left font-semibold text-gray-800 cursor-pointer"
                          onClick={() => handleSort("eventDate")}
                        >
                          Date{" "}
                          {sortConfig.key === "eventDate" &&
                            (sortConfig.direction === "asc" ? (
                              <SouthIcon sx={{ fontSize: 12 }} />
                            ) : (
                              <NorthIcon sx={{ fontSize: 12 }} />
                            ))}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFines.length === 0 ? (
                        <tr>
                          <td
                            colSpan={canEditFines ? 4 : 3}
                            className="text-center py-4 text-gray-700 font-medium text-sm"
                          >
                            No fines
                          </td>
                        </tr>
                      ) : (
                        sortedFines.map((fine) => (
                          <tr
                            key={fine.id}
                            className="border-b border-gray-100 hover:bg-gray-50 last:border-0"
                          >
                            {canEditFines && (
                              <td className="py-1.5 pl-2">
                                <Checkbox
                                  checked={fine.isPaid}
                                  onChange={() => handleCheckboxChange(fine)}
                                />
                              </td>
                            )}
                            <td
                              className={`px-2 py-1.5 max-w-32 truncate ${
                                fine.isPaid
                                  ? "text-gray-500 font-medium line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {fine.eventTitle}
                            </td>
                            <td
                              className={`px-2 py-1.5 ${
                                fine.isPaid
                                  ? "text-gray-500 font-medium line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              ₱{fine.amount.toFixed(2)}
                            </td>
                            <td
                              className={`px-2 py-1.5 font-medium text-gray-800 ${
                                fine.isPaid ? "!text-gray-500 font-medium line-through" : ""
                              }`}
                            >
                              {new Date(fine.eventDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "2-digit",
                                }
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 mt-8">
                <MetricCard
                  label="Total Unpaid Amount"
                  value={`₱${totalUnpaidFines}`}
                  className="!min-w-0 flex flex-col-reverse !p-0 h-fit w-fit bg-transparent border-0"
                  labelClassName="text-nowrap font-medium text-gray-900"
                  valueClassName="!mt-0 !text-base"
                />
              </div>
            </>
          )}
        </div>

        {/* Metrics */}
        <div className="p-8 py-0">
          {metricsError ? (
            <p className="text-sm text-red-500">{metricsError}</p>
          ) : metrics ? (
            <>
              <div className="grid grid-cols-3 gap-y-4 mb-8">
                <MetricCard
                  label="Total Events"
                  value={metrics.summary.totalEvents.toString()}
                  className="!min-w-0 flex flex-col-reverse !p-0 h-fit w-fit bg-transparent border-0"
                  labelClassName="text-nowrap font-medium text-gray-900"
                  valueClassName="!mt-0 !text-base"
                />
                <MetricCard
                  label="Attendance"
                  value={metrics.summary.attendanceRate}
                  className="!min-w-0 flex flex-col-reverse !p-0 h-fit w-fit bg-transparent border-0"
                  labelClassName="text-nowrap font-medium text-gray-900"
                  valueClassName="!mt-0 !text-base"
                />
                <MetricCard
                  label="Present"
                  value={metrics.summary.present.toString()}
                  className="!min-w-0 flex flex-col-reverse !p-0 h-fit w-fit bg-transparent border-0 row-start-2 "
                  labelClassName="text-nowrap font-medium text-gray-900"
                  valueClassName="!mt-0 !text-base"
                />
                <MetricCard
                  label="Absent"
                  value={metrics.summary.absent.toString()}
                  className="!min-w-0 flex flex-col-reverse !p-0 h-fit w-fit bg-transparent border-0 row-start-2 col-start-2"
                  labelClassName="text-nowrap font-medium text-gray-900"
                  valueClassName="!mt-0 !text-base"
                />
                <MetricCard
                  label="Excused"
                  value={metrics.summary.excused.toString()}
                  className="!min-w-0 flex flex-col-reverse !p-0 h-fit w-fit bg-transparent border-0 row-start-2 col-start-3"
                  labelClassName="text-nowrap font-medium text-gray-900"
                  valueClassName="!mt-0 !text-base"
                />
              </div>
              {metrics.attendanceRecords.length > 0 && (
                <div>
                  <p className="text-xs text-gray-900 font-medium mb-3">
                    Attendance History
                  </p>
                  <div className="overflow-y-auto rounded-lg border border-gray-200">
                    {metrics.attendanceRecords.slice(0, 5).map((record, i) => (
                      <div
                        key={`${record.event_id}-${i}`}
                        className="flex justify-between items-center px-4 py-2 text-sm border-b border-gray-200 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.event_title}
                          </p>
                          <p className="text-gray-700 font-medium text-xs">
                            {new Date(record.event_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                            record.status === "Present"
                              ? "text-green-700 bg-green-50"
                              : record.status === "Absent"
                              ? "text-red-700 bg-red-50"
                              : record.status === "Excused"
                              ? "text-orange-700 bg-orange-50"
                              : "text-gray-800 bg-gray-100"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-700 font-medium">No metrics available</p>
          )}
          <p className="text-xs mb-8 mt-8 font-medium text-gray-600">
            The data presented here encompasses all records from the start of the school year on July 1, {schoolYearStart}, through the end of April 30, {schoolYearEnd}.
          </p>
        </div>
        {/* Hidden QR card for download only; button visible */}
        <div className="relative px-8 pb-8 pt-4">
          <button
            type="button"
            onClick={async () => {
              if (!qrCardRef.current) {
                showToast("Failed to download QR code", "error");
                return;
              }
              try {
                const canvas = await html2canvas(qrCardRef.current, {
                  backgroundColor: "#ffffff",
                  scale: 2,
                });
                const url = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = url;
                a.download = `${studentData.studentId}_qr.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } catch {
                showToast("Failed to download QR code", "error");
              }
            }}
            className="w-full rounded-[10px] border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download QR Code
          </button>
        </div>

        <div className="pointer-events-none w-max fixed bottom-0 -left-full">
          <div className="rounded-[10px] border border-gray-200 bg-gray-50/50 p-5 w-fit">
            <StudentQRCard
              ref={qrCardRef}
              studentId={studentData.studentId}
              name={studentData.name}
              college={studentData.college}
              year={studentData.year}
              section={studentData.section}
              size={100}
            />
          </div>
        </div>
      </div>

      {/* Bulk mark all paid modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
      >
        <div className="p-5 w-fit max-w-md">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Mark all fines as paid
          </h2>
          <p className="text-sm text-gray-800 mb-4">
            Are you sure you want to mark all fines as paid? This cannot be
            undone.
          </p>
          <div className="flex items-start gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <input
              type="checkbox"
              id="profile-fines-confirm"
              checked={finesConfirmChecked}
              onChange={(e) => setFinesConfirmChecked(e.target.checked)}
              className="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded"
            />
            <label
              htmlFor="profile-fines-confirm"
              className="text-sm text-green-700"
            >
              I confirm I have verified and take responsibility for this action.
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowConfirmModal(false);
                setFinesConfirmChecked(false);
              }}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSelectAll}
              disabled={!finesConfirmChecked}
              className="px-4 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all as paid
            </button>
          </div>
        </div>
      </Modal>

      {/* Single fine confirm modal */}
      <Modal
        isOpen={showIndividualConfirmModal}
        onClose={() => {
          setShowIndividualConfirmModal(false);
          setPendingFine(null);
          setIndividualConfirmChecked(false);
        }}
      >
        <div className="p-5 w-fit max-w-md">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Mark fine as paid
          </h2>
          <p className="text-sm text-gray-800 mb-4">
            Mark the fine for &quot;{pendingFine?.eventTitle}&quot; as paid?
            This cannot be undone.
          </p>
          <div className="flex items-start gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <input
              type="checkbox"
              id="profile-individual-confirm"
              checked={individualConfirmChecked}
              onChange={(e) => setIndividualConfirmChecked(e.target.checked)}
              className="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded"
            />
            <label
              htmlFor="profile-individual-confirm"
              className="text-sm text-green-700"
            >
              I confirm this payment.
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowIndividualConfirmModal(false);
                setPendingFine(null);
                setIndividualConfirmChecked(false);
              }}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmIndividualFine}
              disabled={!individualConfirmChecked}
              className="px-4 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark as paid
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
