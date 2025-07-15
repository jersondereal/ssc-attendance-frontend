import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import axios from "axios";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import config from "../../../config";
import Checkbox from "../../common/Checkbox/Checkbox";
import { Modal } from "../../common/Modal/Modal";
import type { StudentRecord } from "../../common/Table/Table";

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

interface StudentFinesProps {
  studentData: StudentRecord;
  onClose: () => void;
  currentUserRole?: string;
}

export const StudentFines = ({
  studentData,
  onClose,
  currentUserRole,
}: StudentFinesProps) => {
  const [fines, setFines] = useState<StudentFine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch fines data
  useEffect(() => {
    const fetchFines = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<FineApiResponse[]>(
          `${config.API_BASE_URL}/fines/student/${studentData.studentId}`
        );

        // Transform the data to match our interface and filter out future events
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        console.log("Date filtering - Today:", today.toISOString());

        console.log("Raw API response:", response.data);

        const transformedFines = response.data
          .map((fine: FineApiResponse) => {
            console.log("Processing fine:", fine);
            return {
              id: fine.id,
              eventId: fine.event_id,
              eventTitle: fine.event_title,
              eventDate: fine.event_date,
              amount: parseFloat(fine.amount),
              isPaid: fine.is_paid,
            };
          })
          .filter((fine) => {
            const eventDate = new Date(fine.eventDate);

            // Check if the date is valid
            if (isNaN(eventDate.getTime())) {
              console.log(
                `Date filtering - Invalid date for event "${fine.eventTitle}": ${fine.eventDate}`
              );
              return false; // Exclude fines with invalid dates
            }

            eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            const isPastOrToday = eventDate <= today;
            console.log(
              `Date filtering - Event: "${fine.eventTitle}" (${
                fine.eventDate
              }) -> EventDate: ${eventDate.toISOString()} -> IsPastOrToday: ${isPastOrToday}`
            );
            return isPastOrToday; // Only include events today or in the past
          });

        setFines(transformedFines);
      } catch (error) {
        console.error("Error fetching fines:", error);
        // You might want to show a toast message here
      } finally {
        setIsLoading(false);
      }
    };

    fetchFines();
  }, [studentData.studentId]);

  const handleSort = (
    key: keyof Pick<StudentFine, "eventTitle" | "amount" | "eventDate">
  ) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleCheckboxChange = (fine: StudentFine) => {
    // If already paid, prevent unchecking
    if (fine.isPaid) {
      return;
    }

    // Show confirmation modal for individual fine
    setPendingFine(fine);
    setShowIndividualConfirmModal(true);
  };

  const handleSelectAll = async () => {
    const allChecked = fines.every((fine) => fine.isPaid);

    // If all are already checked, prevent unchecking
    if (allChecked) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmSelectAll = async () => {
    try {
      // Update all fines to paid status
      const updatePromises = fines.map((fine) =>
        axios.put(
          `${config.API_BASE_URL}/fines/student/${studentData.studentId}/event/${fine.eventId}`,
          { isPaid: true }
        )
      );

      await Promise.all(updatePromises);

      // Update local state
      setFines((prev) => prev.map((fine) => ({ ...fine, isPaid: true })));
    } catch (error) {
      console.error("Error updating all fine statuses:", error);
      // You might want to show a toast message here
    } finally {
      setShowConfirmModal(false);
    }
  };

  const cancelSelectAll = () => {
    setShowConfirmModal(false);
    setFinesConfirmChecked(false);
  };

  const confirmIndividualFine = async () => {
    if (!pendingFine) return;

    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/fines/student/${studentData.studentId}/event/${pendingFine.eventId}`,
        { isPaid: true }
      );

      if (response.data) {
        // Update local state
        setFines((prev) =>
          prev.map((f) =>
            f.id === pendingFine.id ? { ...f, isPaid: true } : f
          )
        );
      }
    } catch (error) {
      console.error("Error updating fine status:", error);
      // You might want to show a toast message here
    } finally {
      setShowIndividualConfirmModal(false);
      setIndividualConfirmChecked(false);
      setPendingFine(null);
    }
  };

  const cancelIndividualFine = () => {
    setShowIndividualConfirmModal(false);
    setIndividualConfirmChecked(false);
    setPendingFine(null);
  };

  const sortedFines = [...fines].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle date sorting
    if (sortConfig.key === "eventDate") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalUnpaidFines = fines
    .filter((fine) => !fine.isPaid)
    .reduce((sum, fine) => sum + parseFloat(fine.amount.toString()), 0)
    .toFixed(2);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-600">Loading fines data...</div>
    );
  }

  // Format amount with 2 decimal places
  const formatAmount = (amount: number | string) => {
    return parseFloat(amount.toString()).toFixed(2);
  };

  return (
    <>
      <div className="p-5 w-fit relative bg-gray-100 rounded-md">
        <div className="absolute top-5 right-5">
          <X className="w-4 h-4 cursor-pointer" onClick={onClose} />
        </div>

        <h2 className="text-base w-fit mx-auto font-semibold mb-1">
          {studentData.name}
        </h2>
        <div className="flex flex-row gap-4 w-fit mx-auto text-xs items-center h-fit text-gray-500 mb-6">
          <span>{studentData.studentId}</span>
          <span>{studentData.course.toUpperCase()}</span>
          <div>
            <span>{studentData.year}</span>-
            <span>{studentData.section.toUpperCase()}</span>
          </div>
        </div>

        {/* Fines Overview */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
            <p className="text-gray-600 text-xs">Total Fines</p>
            <p className="text-base font-semibold">{fines.length}</p>
          </div>
          <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
            <p className="text-gray-600 text-xs">Unpaid Amount</p>
            <p className="text-base font-semibold">₱{totalUnpaidFines}</p>
          </div>
        </div>

        {/* Fines Table */}
        <div className="bg-white p-4 rounded-lg">
          <h3 className="text-sm text-gray-700 mb-4">Fines Details</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-2 pl-2 py-3 border-b border-gray-200">
                    {currentUserRole !== "Viewer" && (
                      <Checkbox
                        checked={
                          fines.length > 0 && fines.every((fine) => fine.isPaid)
                        }
                        onChange={handleSelectAll}
                      />
                    )}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer border-b border-gray-200"
                    onClick={() => handleSort("eventTitle")}
                  >
                    <div className="flex items-center gap-1">
                      Event
                      {sortConfig.key === "eventTitle" &&
                        (sortConfig.direction === "asc" ? (
                          <SouthIcon sx={{ fontSize: "0.8rem" }} />
                        ) : (
                          <NorthIcon sx={{ fontSize: "0.8rem" }} />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer border-b border-gray-200"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1">
                      Fine
                      {sortConfig.key === "amount" &&
                        (sortConfig.direction === "asc" ? (
                          <SouthIcon sx={{ fontSize: "0.8rem" }} />
                        ) : (
                          <NorthIcon sx={{ fontSize: "0.8rem" }} />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer border-b border-gray-200"
                    onClick={() => handleSort("eventDate")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortConfig.key === "eventDate" &&
                        (sortConfig.direction === "asc" ? (
                          <SouthIcon sx={{ fontSize: "0.8rem" }} />
                        ) : (
                          <NorthIcon sx={{ fontSize: "0.8rem" }} />
                        ))}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-4 text-gray-500 text-sm"
                    >
                      No fines found
                    </td>
                  </tr>
                ) : (
                  sortedFines.map((fine) => (
                    <tr
                      key={fine.id}
                      className="border-b border-gray-200 hover:bg-gray-100 last:border-b-0 transition-colors"
                    >
                      <td className="pl-2 py-1">
                        {currentUserRole !== "Viewer" && (
                          <Checkbox
                            checked={fine.isPaid}
                            onChange={() => handleCheckboxChange(fine)}
                          />
                        )}
                      </td>
                      <td
                        className={`px-4 py-2 text-xs max-w-40 ${
                          fine.isPaid
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {fine.eventTitle}
                      </td>
                      <td
                        className={`px-4 py-2 text-xs ${
                          fine.isPaid
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        ₱{formatAmount(fine.amount)}
                      </td>
                      <td
                        className={`px-4 py-2 text-xs ${
                          fine.isPaid
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {new Date(fine.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={cancelSelectAll}>
        <div className="p-5 w-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Confirm bulk fines update
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Are you sure you want to mark all fines as paid? This action cannot
            be undone.
          </p>

          <div className="flex items-start gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
            <input
              type="checkbox"
              id="fines-confirm"
              checked={finesConfirmChecked}
              onChange={(e) => setFinesConfirmChecked(e.target.checked)}
              className="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="fines-confirm" className="text-xs text-green-700">
              I understand that this action will mark all fines as paid. This
              action cannot be undone. I confirm that I have verified the
              selection and take responsibility for this action.
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmSelectAll}
              disabled={!finesConfirmChecked}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 border border-green-500 rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All as Paid
            </button>
          </div>
        </div>
      </Modal>

      {/* Individual Fine Confirmation Modal */}
      <Modal isOpen={showIndividualConfirmModal} onClose={cancelIndividualFine}>
        <div className="p-5 w-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Confirm fine payment
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Are you sure you want to mark the fine for "
            {pendingFine?.eventTitle}" as paid? This action cannot be undone.
          </p>

          <div className="flex items-start gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
            <input
              type="checkbox"
              id="individual-fine-confirm"
              checked={individualConfirmChecked}
              onChange={(e) => setIndividualConfirmChecked(e.target.checked)}
              className="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label
              htmlFor="individual-fine-confirm"
              className="text-xs text-green-700"
            >
              I understand that this action will mark this fine as paid. This
              action cannot be undone. I confirm that I have verified the
              selection and take responsibility for this action.
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelIndividualFine}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmIndividualFine}
              disabled={!individualConfirmChecked}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 border border-green-500 rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark as Paid
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
