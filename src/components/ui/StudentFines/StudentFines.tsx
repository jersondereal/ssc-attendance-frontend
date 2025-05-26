import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import Checkbox from "@mui/material/Checkbox";
import axios from "axios";
import { useEffect, useState } from "react";
import config from "../../../config";
import { Button } from "../../common/Button/Button";
import type { StudentRecord } from "../../common/Table/Table";

interface StudentFine {
  id: number;
  eventId: number;
  eventTitle: string;
  amount: number;
  isPaid: boolean;
}

interface FineApiResponse {
  id: number;
  event_id: number;
  event_title: string;
  amount: number;
  is_paid: boolean;
}

interface StudentFinesProps {
  studentData: StudentRecord;
  onClose: () => void;
}

export const StudentFines = ({ studentData, onClose }: StudentFinesProps) => {
  const [fines, setFines] = useState<StudentFine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Pick<StudentFine, "eventTitle" | "amount">;
    direction: "asc" | "desc";
  }>({ key: "eventTitle", direction: "asc" });

  // Fetch fines data
  useEffect(() => {
    const fetchFines = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<FineApiResponse[]>(
          `${config.API_BASE_URL}/fines/student/${studentData.studentId}`
        );

        // Transform the data to match our interface
        const transformedFines = response.data.map((fine: FineApiResponse) => ({
          id: fine.id,
          eventId: fine.event_id,
          eventTitle: fine.event_title,
          amount: fine.amount,
          isPaid: fine.is_paid,
        }));

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
    key: keyof Pick<StudentFine, "eventTitle" | "amount">
  ) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleCheckboxChange = async (fine: StudentFine) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/fines/student/${studentData.studentId}/event/${fine.eventId}`,
        { isPaid: !fine.isPaid }
      );

      if (response.data) {
        // Update local state
        setFines((prev) =>
          prev.map((f) => (f.id === fine.id ? { ...f, isPaid: !f.isPaid } : f))
        );
      }
    } catch (error) {
      console.error("Error updating fine status:", error);
      // You might want to show a toast message here
    }
  };

  const sortedFines = [...fines].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

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
    <div className="p-6">
      <h2 className="text-base font-semibold mb-6">Student Fines</h2>

      {/* Student Information */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">
          Student Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm border border-border-dark p-4 rounded-md">
          <div>
            <p className="text-gray-500 text-xs">Name</p>
            <p className="font-medium">{studentData.name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">ID</p>
            <p className="font-medium">{studentData.studentId}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Course</p>
            <p className="font-medium">{studentData.course}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Year & Section</p>
            <p className="font-medium">
              {studentData.year}-{studentData.section}
            </p>
          </div>
        </div>
      </div>

      {/* Fines Table */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">
          Fines Overview
        </h3>
        <div className="bg-white rounded-md border border-border-dark">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-dark bg-background-dark">
                <th className="w-2 px-2 py-3"></th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer"
                  onClick={() => handleSort("eventTitle")}
                >
                  <div className="flex items-center gap-1">
                    EVENT
                    {sortConfig.key === "eventTitle" &&
                      (sortConfig.direction === "asc" ? (
                        <SouthIcon sx={{ fontSize: "1rem" }} />
                      ) : (
                        <NorthIcon sx={{ fontSize: "1rem" }} />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center gap-1">
                    FINE
                    {sortConfig.key === "amount" &&
                      (sortConfig.direction === "asc" ? (
                        <SouthIcon sx={{ fontSize: "1rem" }} />
                      ) : (
                        <NorthIcon sx={{ fontSize: "1rem" }} />
                      ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFines.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-4 text-gray-500 text-sm"
                  >
                    No fines found
                  </td>
                </tr>
              ) : (
                sortedFines.map((fine) => (
                  <tr
                    key={fine.id}
                    className="border-b border-border-dark hover:bg-gray-100 last:border-b-0"
                  >
                    <td className="px-1 py-1">
                      <Checkbox
                        checked={fine.isPaid}
                        onChange={() => handleCheckboxChange(fine)}
                        size="small"
                      />
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-700">
                      {fine.eventTitle}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-700">
                      ₱{formatAmount(fine.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Amount */}
      <div className="mt-4 flex justify-end items-center gap-2 text-sm">
        <span className="text-gray-600">Total Unpaid Fines:</span>
        <span className="font-medium">₱{totalUnpaidFines}</span>
      </div>

      <Button
        label="Close"
        className="w-full mt-6 !py-2.5 font-medium"
        variant="secondary"
        onClick={onClose}
      />
    </div>
  );
};
