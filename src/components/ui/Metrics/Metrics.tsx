import axios from "axios";
import { useEffect, useState } from "react";
import config from "../../../config";
import { Button } from "../../common/Button/Button";
import { X } from 'lucide-react';

interface MetricsProps {
  studentData: {
    studentId: string;
    name: string;
    course: string;
    year: string;
    section: string;
  };
  onClose: () => void;
}

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
    course: string;
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

export const Metrics = ({ studentData, onClose }: MetricsProps) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${config.API_BASE_URL}/students/${studentData.studentId}/metrics`
        );
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError("Failed to load student metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [studentData.studentId]);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-base font-semibold mb-6">Student Metrics</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-base font-semibold mb-6">Student Metrics</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">{error}</p>
        </div>
        <Button
          label="Close"
          className="w-full mt-4 !py-2.5 font-medium"
          variant="secondary"
          onClick={onClose}
        />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <h2 className="text-base font-semibold mb-6">Student Metrics</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No metrics available</p>
        </div>
        <Button
          label="Close"
          className="w-full mt-4 !py-2.5 font-medium"
          variant="secondary"
          onClick={onClose}
        />
      </div>
    );
  }

  return (
    <div className="p-5 w-fit relative bg-gray-100 rounded-md">
      <div className="absolute top-5 right-5">
        <X className="w-4 h-4" onClick={onClose} />
      </div>

      <h2 className="text-base w-fit mx-auto font-semibold mb-1">
        {metrics.student.name}
      </h2>
      <div className="flex flex-row gap-4 w-fit mx-auto text-xs items-center h-fit text-gray-500 mb-6">
        <span>{metrics.student.student_id}</span>
        <span>{metrics.student.course.toUpperCase()}</span>
        <div>
          <span>{metrics.student.year}</span>-
          <span>{metrics.student.section.toUpperCase()}</span>
        </div>
      </div>

      {/* Attendance Metrics */}
      <div className="mb-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
          <p className="text-gray-600 text-xs">Total Events</p>
          <p className="text-base font-semibold">
            {metrics.summary.totalEvents}
          </p>
        </div>
        <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
          <p className="text-gray-600 text-xs">Attendance</p>
          <p className="text-base font-semibold">
            {metrics.summary.attendanceRate}
          </p>
        </div>
        <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
          <p className="text-gray-600 text-xs">Present</p>
          <p className="text-base font-semibold">{metrics.summary.present}</p>
        </div>
        <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
          <p className="text-gray-600 text-xs">Absent</p>
          <p className="text-base font-semibold">{metrics.summary.absent}</p>
        </div>
        <div className="p-4 rounded-lg flex flex-col gap-4 h-fit bg-white">
          <p className="text-gray-600 text-xs">Excused</p>
          <p className="text-base font-semibold">{metrics.summary.excused}</p>
        </div>
      </div>

      {/* Recent Attendance Records */}
      {metrics.attendanceRecords.length > 0 && (
        <div className="bg-white p-4 rounded-lg">
          <h3 className="text-sm text-gray-700 mb-4">
            Recent Attendance Records
          </h3>
          <div className="max-h-60 bg-gray-50 border border-gray-200 overflow-y-auto rounded-md">
            {metrics.attendanceRecords.slice(0, 5).map((record, index) => (
              <div
                key={index}
                className="p-3 last:border-b-0 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{record.event_title}</p>
                    <p className="text-gray-500">
                      {new Date(record.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-xs ${
                      record.status === "Present"
                        ? "text-green-600 bg-green-50"
                        : record.status === "Absent"
                        ? "text-red-600 bg-red-50"
                        : record.status === "Excused"
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-500 bg-gray-50"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
