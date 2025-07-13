import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Analytics } from "@vercel/analytics/react";
import axios from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import { Button } from "./components/common/Button/Button";
import { DropdownSelector } from "./components/common/DropdownSelector/DropdownSelector";
import {
  EventSelector,
  type Event,
} from "./components/common/EventSelector/EventSelector";
import { Modal } from "./components/common/Modal/Modal";
import { SearchBar } from "./components/common/SearchBar/SearchBar";
import type { TableRecord } from "./components/common/Table/Table";
import { Table } from "./components/common/Table/Table";

import NavigationMenu from "./components/common/NavigationMenu/NavigationMenu";
import { UserMenu } from "./components/common/UserMenu/UserMenu";
import { AddStudentForm } from "./components/forms/AddStudentForm/AddStudentForm";
import { EditStudentForm } from "./components/forms/EditStudentForm/EditStudentForm";
import { Metrics } from "./components/ui/Metrics/Metrics";
import { StudentFines } from "./components/ui/StudentFines/StudentFines";
import config from "./config";
import { ToastProvider, useToast } from "./contexts/ToastContext";

interface AttendanceRecord {
  studentId: string;
  name: string;
  course: string;
  year: string;
  section: string;
  status: string;
}

interface StudentRecord {
  studentId: string;
  name: string;
  course: string;
  year: string;
  section: string;
  rfid?: string;
}

interface DBStudent {
  id: number;
  student_id: string;
  name: string;
  course: string;
  year: string;
  section: string;
  rfid: string;
  created_at: string;
  updated_at: string;
}

interface DBAttendance {
  id: number;
  student_id: string;
  event_id: number;
  status: string;
  check_in_time: string;
  created_at: string;
  updated_at: string;
  name: string;
  course: string;
  year: string;
  section: string;
}

interface DBEvent {
  id: number;
  title: string;
  event_date: string;
  location: string;
  fine: number;
  created_at: string;
  updated_at: string;
}

function AppContent() {
  const { showToast } = useToast();
  const [selectedTable, setSelectedTable] = useState("attendance");
  const [selectedFilters, setSelectedFilters] = useState({
    course: "all",
    year: "all",
    section: "all",
  });
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isFinesModalOpen, setIsFinesModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [isBulkAttendanceModalOpen, setIsBulkAttendanceModalOpen] =
    useState(false);
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState<string>("");
  const [bulkAttendanceConfirmChecked, setBulkAttendanceConfirmChecked] =
    useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(
    undefined
  );
  const [editingStudent, setEditingStudent] = useState<
    AttendanceRecord | StudentRecord | null
  >(null);
  const [selectedStudentForMetrics, setSelectedStudentForMetrics] =
    useState<StudentRecord | null>(null);
  const [selectedStudentForFines, setSelectedStudentForFines] =
    useState<StudentRecord | null>(null);
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    console.log("Current user:", currentUser);
  }, [currentUser]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isRowsModalOpen, setIsRowsModalOpen] = useState(false);
  const [rowsDropdownPosition, setRowsDropdownPosition] = useState({
    top: 0,
    left: 0,
  });
  const rowsDropdownRef = useRef<HTMLDivElement>(null);

  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAttendance, setTotalAttendance] = useState(0);

  // Fetch students from database
  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/students`)
      .then((res) => {
        const mappedStudents = res.data.map((student: DBStudent) => ({
          studentId: student.student_id,
          name: student.name,
          course: student.course.toUpperCase(),
          year: student.year,
          section: student.section.toUpperCase(),
          rfid: student.rfid,
        }));
        setStudents(mappedStudents);
        setTotalStudents(res.data.length);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Fetch all events from database
  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/events`)
      .then((res) => {
        setEvents(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Fetch attendance data from database
  useEffect(() => {
    if (selectedEvent) {
      axios
        .get(`${config.API_BASE_URL}/attendance/event/${selectedEvent?.id}`)
        .then((res) => {
          const mappedAttendance = res.data.map((record: DBAttendance) => ({
            studentId: record.student_id,
            name: record.name,
            course: record.course.toUpperCase(),
            year: record.year,
            section: record.section.toUpperCase(),
            status: record.status,
          }));

          setAttendanceData(mappedAttendance);
          setTotalAttendance(res.data.length);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      setAttendanceData([]);
      setTotalAttendance(0);
    }
  }, [selectedEvent]);

  const handleTableAction = (action: string, row: TableRecord) => {
    switch (action) {
      case "status":
        if ("status" in row) {
          setAttendanceData((prevData) =>
            prevData.map((item) =>
              item.studentId === row.studentId ? row : item
            )
          );

          // update attendance in database
          axios
            .put(
              `${config.API_BASE_URL}/attendance/${row.studentId}/${selectedEvent?.id}`,
              { status: row.status }
            )
            .then((res) => {
              console.log("Attendance updated in database:", res);
              showToast(
                `${
                  row.name
                }'s attendance marked as ${row.status.toLowerCase()}`,
                "success"
              );
            })
            .catch((err) => {
              console.error(err);
              showToast(
                `Failed to update ${row.name}'s attendance status`,
                "error"
              );
            });
        }
        break;
      case "edit":
        if ("studentId" in row) {
          setEditingStudent(row as AttendanceRecord | StudentRecord);
          setIsEditStudentModalOpen(true);
        }
        break;
      case "metrics":
        if ("studentId" in row) {
          setSelectedStudentForMetrics(row as StudentRecord);
          setIsMetricsModalOpen(true);
        }
        break;
      case "fines":
        if ("studentId" in row) {
          setSelectedStudentForFines(row as StudentRecord);
          setIsFinesModalOpen(true);
        }
        break;
    }
  };

  const handleAddStudent = () => {
    setIsAddStudentModalOpen(true);
  };

  const handleAddStudentSubmit = async (data: {
    studentId: string;
    name: string;
    course: string;
    year: string;
    section: string;
    rfid: string;
  }) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/students`, {
        student_id: data.studentId,
        name: data.name,
        course: data.course.toLowerCase(),
        year: data.year,
        section: data.section.toLowerCase(),
        rfid: data.rfid.trim(), // Trim whitespace and use empty string if not provided
      });

      const newStudent = response.data;

      // Update local state with the new student
      setStudents((prev) => [
        ...prev,
        {
          studentId: newStudent.student_id,
          name: newStudent.name,
          course: newStudent.course.toUpperCase(),
          year: newStudent.year,
          section: newStudent.section.toUpperCase(),
          rfid: newStudent.rfid,
        },
      ]);

      // Update total students count
      setTotalStudents((prev) => prev + 1);

      showToast(`Student ${newStudent.name} added successfully`, "success");
      setIsAddStudentModalOpen(false);
    } catch (error: unknown) {
      console.error("Error adding student:", error);
      if (axios.isAxiosError(error)) {
        showToast(
          error.response?.data?.message || "Failed to add student",
          "error"
        );
      } else {
        showToast("Failed to add student", "error");
      }
    }
  };

  const handleEditStudentSubmit = (data: {
    studentId: string;
    name: string;
    course: string;
    year: string;
    section: string;
  }) => {
    if (selectedTable === "attendance") {
      setAttendanceData((prevData) =>
        prevData.map((item) =>
          item.studentId === data.studentId ? { ...item, ...data } : item
        )
      );
    } else {
      setStudents((prevData) =>
        prevData.map((item) =>
          item.studentId === data.studentId ? { ...item, ...data } : item
        )
      );
    }
    setIsEditStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleEventChange = (event: Event) => {
    setSelectedEvent(event);
    showToast(`Viewing attendance for ${event.name}`, "info");
  };

  const handleAddEvent = async (eventData: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
  }) => {
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/events/`,
        eventData
      );
      const newEvent = response.data;

      // Add new event to the list
      console.log("Adding event to list");
      setEvents((prevEvents) => [...prevEvents, newEvent]);

      // Show success toast
      showToast(`Event "${newEvent.title}" created successfully`);
    } catch (error) {
      console.error("Error creating event:", error);
      showToast("Failed to create event");
    }
  };

  const handleEditEvent = async (event: Event) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/events/${event.id}`,
        {
          title: event.name,
          event_date: event.date,
          location: event.location,
          fine: event.fine,
        }
      );
      const updatedEvent = response.data;

      // Update the event in the events list
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id.toString() === updatedEvent.id.toString() ? updatedEvent : e
        )
      );

      showToast(`Event "${updatedEvent.title}" updated successfully`);
    } catch (error) {
      console.error("Error updating event:", error);
      showToast("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/events/${eventId}`);

      // Remove the event from the events list
      setEvents((prevEvents) =>
        prevEvents.filter((e) => e.id.toString() !== eventId)
      );

      // If the deleted event was selected, clear the selection
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(undefined);
      }

      showToast("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Failed to delete event");
    }
  };

  // Add RFID submission handler
  const handleRfidSubmit = async (rfid: string) => {
    console.log(rfid);

    if (!selectedEvent) {
      showToast("Please select an event first", "error");
      return;
    }

    try {
      // Update attendance in database using RFID
      const response = await axios.put(
        `${config.API_BASE_URL}/attendance/rfid/${rfid}/${selectedEvent.id}`,
        { status: "present" }
      );

      console.log(response);

      // Get the updated student data from response
      const studentData = response.data;

      // Update local attendance data
      const newAttendanceRecord: AttendanceRecord = {
        studentId: studentData.student_id,
        name: studentData.student.name,
        course: studentData.student.course.toUpperCase(),
        year: studentData.student.year,
        section: studentData.student.section.toUpperCase(),
        status: "present",
      };

      setAttendanceData((prev) => {
        const existingIndex = prev.findIndex(
          (a) => a.studentId === studentData.student_id
        );
        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...prev];
          updated[existingIndex] = newAttendanceRecord;
          return updated;
        } else {
          // Add new record
          return [...prev, newAttendanceRecord];
        }
      });

      showToast(`${studentData.student.name} marked as present`, "success");
      // setIsRfidModalOpen(false);
    } catch (error) {
      console.error("Error updating attendance:", error);
      if (axios.isAxiosError(error)) {
        showToast(
          error.response?.data?.message || "Failed to update attendance",
          "error"
        );
      } else {
        showToast("Failed to update attendance", "error");
      }
    }
  };
  const attendanceColumns = [
    { key: "studentId", label: "Id", width: "0" },
    { key: "name", label: "Name", width: "100" },
    { key: "course", label: "Course", width: "0" },
    { key: "year", label: "Year", width: "0" },
    { key: "section", label: "Section", width: "0" },
    { key: "status", label: "Status", width: "0" },
  ];

  const studentColumns = [
    { key: "studentId", label: "Id", width: "0" },
    { key: "rfid", label: "Rfid", width: "0" },
    { key: "name", label: "Name", width: "100" },
    { key: "course", label: "Course", width: "0" },
    { key: "year", label: "Year", width: "0" },
    { key: "section", label: "Section", width: "0" },
  ];

  const courseOptions = [
    { value: "all", label: "All Courses" },
    { value: "bsit", label: "BSIT" },
    { value: "bshm", label: "BSHM" },
    { value: "bscrim", label: "BSCrim" },
  ];

  const yearOptions = [
    { value: "all", label: "All Years" },
    { value: "1", label: "Year 1" },
    { value: "2", label: "Year 2" },
    { value: "3", label: "Year 3" },
    { value: "4", label: "Year 4" },
  ];

  const sectionOptions = [
    { value: "all", label: "All Sections" },
    { value: "a", label: "Section A" },
    { value: "b", label: "Section B" },
    { value: "c", label: "Section C" },
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleLogout = () => {
    console.log("Logging out...");
  };

  const handleDownload = () => {
    const data = getFilteredData();
    // Sort the data using the same logic as the table
    const sortedData = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof TableRecord];
      const bValue = b[sortConfig.key as keyof TableRecord];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const workbook = XLSX.utils.book_new();

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      selectedTable === "attendance" ? "Attendance" : "Students"
    );

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTable}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast(`Exported ${sortedData.length} records to Excel`, "success");
  };

  // Filter the data based on selected filters and search query
  const getFilteredData = useCallback(() => {
    const data = selectedTable === "attendance" ? attendanceData : students;

    return data.filter((item) => {
      // Search filter
      const searchMatch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course.toLowerCase().includes(searchQuery.toLowerCase());

      // Other filters
      const courseMatch =
        selectedFilters.course === "all" ||
        item.course.toLowerCase() === selectedFilters.course;
      const yearMatch =
        selectedFilters.year === "all" || item.year === selectedFilters.year;
      const sectionMatch =
        selectedFilters.section === "all" ||
        item.section.toLowerCase() === selectedFilters.section;

      return searchMatch && courseMatch && yearMatch && sectionMatch;
    });
  }, [selectedTable, attendanceData, students, selectedFilters, searchQuery]);

  // Sort the filtered data first
  const filteredData = getFilteredData();
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof TableRecord];
    const bValue = b[sortConfig.key as keyof TableRecord];

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    setCurrentPage(newPage);
    setPageInputValue(newPage.toString());
  };

  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    setPageInputValue(newPage.toString());
  };

  const handleRowsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setIsRowsModalOpen(false);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = parseInt(e.currentTarget.value);
      if (value && value >= 1 && value <= totalPages) {
        setCurrentPage(value);
        setPageInputValue(value.toString());
      } else {
        setCurrentPage(1);
        setPageInputValue("1");
      }
      e.currentTarget.blur();
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*$/.test(value)) {
      setPageInputValue(value);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInputValue("1");
  }, [selectedFilters, searchQuery, selectedTable]);

  // Clear selected rows when table changes
  useEffect(() => {
    setSelectedRows([]);
  }, [selectedTable]);

  // Sync input value with current page
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const handleFilterChange = (
    filterType: "course" | "year" | "section",
    value: string
  ) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));

    // Show toast for filter change
    const filterName = filterType.charAt(0).toUpperCase() + filterType.slice(1);
    const filterValue = value === "all" ? "All" : value.toUpperCase();
    showToast(`${filterName} filter set to ${filterValue}`, "info");
  };

  const handleUserChange = useCallback(
    (user: { username: string; role: string } | null) => {
      setCurrentUser(user);
    },
    []
  );

  const handleDeleteSelected = () => {
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const selectedData = selectedRows.map((index) => currentData[index]);
    const studentIds = selectedData.map((student) => student.studentId);

    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/students/bulk`,
        {
          data: { studentIds },
        }
      );

      // Remove deleted students from local state
      if (selectedTable === "students") {
        setStudents((prev) =>
          prev.filter((student) => !studentIds.includes(student.studentId))
        );
      }

      setSelectedRows([]);
      setIsDeleteConfirmModalOpen(false);
      setDeleteConfirmChecked(false);
      showToast(response.data.message, "success");
    } catch (error) {
      console.error("Error deleting students:", error);
      if (axios.isAxiosError(error)) {
        showToast(
          error.response?.data?.message || "Failed to delete selected students",
          "error"
        );
      } else {
        showToast("Failed to delete selected students", "error");
      }
    }
  };

  const handleConfirmBulkAttendance = async () => {
    const selectedData = selectedRows.map((index) => currentData[index]);
    const studentIds = selectedData.map((student) => student.studentId);

    if (!selectedEvent) {
      showToast("Please select an event first", "error");
      return;
    }

    try {
      // Update attendance for all selected students
      const updatePromises = studentIds.map((studentId) =>
        axios.put(
          `${config.API_BASE_URL}/attendance/${studentId}/${selectedEvent.id}`,
          { status: bulkAttendanceStatus }
        )
      );

      await Promise.all(updatePromises);

      // Update local attendance data
      setAttendanceData((prev) =>
        prev.map((item) =>
          studentIds.includes(item.studentId)
            ? { ...item, status: bulkAttendanceStatus }
            : item
        )
      );

      setSelectedRows([]);
      setIsBulkAttendanceModalOpen(false);
      setBulkAttendanceConfirmChecked(false);
      showToast(
        `Marked ${selectedData.length} student(s) as ${bulkAttendanceStatus}`,
        "success"
      );
    } catch (error) {
      console.error("Error updating bulk attendance:", error);
      showToast("Failed to update attendance for selected students", "error");
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rowsDropdownRef.current &&
        !rowsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRowsModalOpen(false);
      }
    };

    if (isRowsModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRowsModalOpen]);

  const handleRowsClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRowsDropdownPosition({
      top: rect.top + window.scrollY - 175, // Position above the button (moved up for more buttons)
      left: rect.left + window.scrollX,
    });
    setIsRowsModalOpen(!isRowsModalOpen);
  };

  return (
    <div className="app bg-white h-[100vh] pb-5">
      <Analytics />
      {/* Header */}
      <div className="w-full h-fit flex flex-col py-0 px-4 border-b border-border-dark bg-white gap-3 mb-5 z-20">
        {/* Top part */}
        <div className="flex flex-row items-center w-full">
          {/* Logo and Navigation */}
          <div className="flex flex-row items-center mr-auto">
            <img
              src="/logo.png"
              alt="SSC Logo"
              className="h-8 w-auto mr-6"
              style={{ maxHeight: "2rem" }}
            />
            <NavigationMenu
              activeItem={selectedTable}
              onItemClick={setSelectedTable}
            />
          </div>
          {/* User Menu */}
          <div className="flex flex-row items-center gap-3">
            {currentUser && (
              <span className="font-medium text-xs text-gray-600 hidden sm:block">
                @{currentUser.username}
              </span>
            )}
            <UserMenu onLogout={handleLogout} onUserChange={handleUserChange} />
          </div>
        </div>
      </div>

      {!currentUser ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Welcome to SSC Attendance
            </h2>
            <p className="text-gray-500 text-sm">
              Please login to access the system
            </p>
          </div>
        </div>
      ) : selectedTable === "events" ? (
        <div className="w-full max-w-[60rem] mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Under Construction
            </h2>
            <p className="text-gray-500 text-sm">
              Events page is coming soon...
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full px-5">
          {/* Menu bar container  */}
          <div className="flex flex-row w-full max-w-[60rem] mx-auto mb-3 z-100 items-end ">
            {selectedRows.length > 0 ? (
              <div className="flex flex-row items-center gap-2 ">
                <Button
                  onClick={handleDownload}
                  // icon={<SaveAltIcon sx={{ fontSize: "0.9rem" }} />}
                  variant="primary"
                  title="Export Table Data"
                  label="Export"
                />
                {selectedTable === "students" && (
                  <Button
                    icon={
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.9rem" }} />
                    }
                    label={`Delete ${selectedRows.length} row${
                      selectedRows.length > 1 ? "s" : ""
                    }`}
                    variant="danger"
                    onClick={handleDeleteSelected}
                  />
                )}

                {selectedTable === "attendance" && (
                  <>
                    <Button
                      label="Present"
                      variant="primary"
                      onClick={() => {
                        setBulkAttendanceStatus("present");
                        setIsBulkAttendanceModalOpen(true);
                      }}
                    />
                    <Button
                      label="Absent"
                      variant="primary"
                      onClick={() => {
                        setBulkAttendanceStatus("absent");
                        setIsBulkAttendanceModalOpen(true);
                      }}
                    />
                    <Button
                      label="Excused"
                      variant="primary"
                      onClick={() => {
                        setBulkAttendanceStatus("excused");
                        setIsBulkAttendanceModalOpen(true);
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex md:flex-row flex-col mr-0 sm:mr-3 gap-y-2">
                {/* Date and Event Group */}
                <div className={`flex flex-row`}>
                  {selectedTable === "attendance" ? (
                    <div className="flex flex-row gap-3 items-center">
                      {currentUser?.role !== "Viewer" && (
                        <Button
                          // icon={<HowToRegIcon sx={{ fontSize: "0.9rem" }} />}
                          label="RFID Check-In"
                          variant="primary"
                          onClick={() => setIsRfidModalOpen(true)}
                        />
                      )}
                      <EventSelector
                        className="w-32 md:w-40 mr-3"
                        value={selectedEvent}
                        onChange={handleEventChange}
                        placeholder="Select event"
                        events={events.map((event) => ({
                          id: event.id.toString(),
                          name: event.title,
                          date: event.event_date,
                          location: event.location,
                          fine: event.fine,
                        }))}
                        onAddEvent={handleAddEvent}
                        onEditEvent={handleEditEvent}
                        onDeleteEvent={handleDeleteEvent}
                        currentUserRole={currentUser?.role}
                      />
                    </div>
                  ) : (
                    currentUser?.role !== "Viewer" && (
                      <Button
                        className="mr-3"
                        onClick={handleAddStudent}
                        label="Add Student"
                        variant="primary"
                        title="Add New Student"
                      />
                    )
                  )}
                  <SearchBar
                    className="block md:hidden ml-0"
                    onSearch={handleSearch}
                  />
                </div>
                {/* Filters Section */}
                <div className="flex flex-row items-center gap-3 w-full text-xs">
                  <DropdownSelector
                    placeholder="Course"
                    options={courseOptions}
                    value={selectedFilters.course}
                    onChange={(value) => handleFilterChange("course", value)}
                    className={`max-w-32`}
                  />
                  <DropdownSelector
                    placeholder="Year"
                    options={yearOptions}
                    value={selectedFilters.year}
                    onChange={(value) => handleFilterChange("year", value)}
                    className={`max-w-32`}
                  />
                  <DropdownSelector
                    placeholder="Section"
                    options={sectionOptions}
                    value={selectedFilters.section}
                    onChange={(value) => handleFilterChange("section", value)}
                    className={`max-w-32`}
                  />
                </div>
              </div>
            )}
            <SearchBar
              className="hidden md:block ml-auto"
              onSearch={handleSearch}
            />
          </div>

          {/* Attendance / Students tables */}
          {selectedTable === "attendance" ? (
            <Table
              columns={attendanceColumns}
              data={currentData}
              onActionClick={handleTableAction}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              currentUserRole={currentUser?.role}
              tableType="attendance"
            />
          ) : (
            <Table
              columns={studentColumns}
              data={currentData}
              onActionClick={handleTableAction}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              currentUserRole={currentUser?.role}
              tableType="students"
            />
          )}

          {/* Pagination */}
          <div className="flex flex-row max-w-[60rem] mx-auto items-center justify-end text-xs text-zinc-500 mt-3">
            <div className="flex flex-row mr-4 items-center gap-4">
              <div>
                {selectedTable === "attendance"
                  ? totalAttendance
                  : totalStudents}{" "}
                records
              </div>
              <div
                className="bg-white border border-border-dark text-black py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-50"
                onClick={handleRowsClick}
              >
                {itemsPerPage} rows
              </div>
            </div>

            <div className="flex flex-row gap-2 items-center justify-center">
              <button
                onClick={handlePreviousPage}
                className={`bg-white border border-border-dark rounded-md p-1 grid place-items-center hover:bg-gray-100 hover:border-gray-400 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ArrowLeft size={16} className="text-gray-600" />
              </button>
              <div className="flex flex-row gap-1 items-center">
                <span>Page</span>
                <input
                  type="text"
                  className="w-10 text-center text-xs bg-white border border-border-dark outline-none focus:border-gray-500 rounded-md py-1"
                  value={pageInputValue || ""}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputKeyDown}
                />
                <span>of</span>
                <span>{totalPages}</span>
              </div>
              <button
                onClick={handleNextPage}
                className={`bg-white border border-border-dark rounded-md p-1 grid place-items-center hover:bg-gray-100 hover:border-gray-400 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <ArrowRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFID Check-in Modal */}
      <Modal isOpen={isRfidModalOpen} onClose={() => setIsRfidModalOpen(false)}>
        <div
          className="p-6 text-center"
          onClick={(e) => {
            // Find and focus the input when clicking anywhere in the modal
            const input = e.currentTarget.querySelector("input");
            input?.focus();
          }}
        >
          {/* <div className="rounded-full w-fit mx-auto overflow-hidden mt-8">
            <img
              src="/rfid-scan.svg"
              alt="RFID Scanner"
              className="h-24 text-zinc-400"
            />
          </div> */}
          <h2 className="font-medium select-none mt-8">Ready to Scan</h2>
          <p className="text-sm font-light text-gray-600 mt-4 select-none">
            Please tap your RFID card on the RFID reader to record attendance
            for this event.
          </p>
          <input
            type="text"
            className="sr-only"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRfidSubmit(e.currentTarget.value);
                e.currentTarget.value = ""; // Clear input after submission
              }
            }}
          />
          <Button
            label="Done"
            className="min-w-full mt-12 py-2 !text-sm"
            variant="secondary"
            onClick={() => setIsRfidModalOpen(false)}
          />
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
      >
        <AddStudentForm
          onSubmit={handleAddStudentSubmit}
          onCancel={() => setIsAddStudentModalOpen(false)}
        />
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setEditingStudent(null);
        }}
      >
        {editingStudent && (
          <EditStudentForm
            onSubmit={handleEditStudentSubmit}
            onCancel={() => {
              setIsEditStudentModalOpen(false);
              setEditingStudent(null);
            }}
            initialData={editingStudent}
          />
        )}
      </Modal>

      {/* Metrics Modal */}
      <Modal
        modalClassName="!w-fit !max-w-fit"
        isOpen={isMetricsModalOpen}
        onClose={() => {
          setIsMetricsModalOpen(false);
          setSelectedStudentForMetrics(null);
        }}
      >
        {selectedStudentForMetrics && (
          <Metrics
            studentData={selectedStudentForMetrics}
            onClose={() => {
              setIsMetricsModalOpen(false);
              setSelectedStudentForMetrics(null);
            }}
          />
        )}
      </Modal>

      {/* Fines Modal */}
      <Modal
        modalClassName="!w-fit !max-w-fit"
        isOpen={isFinesModalOpen}
        onClose={() => {
          setIsFinesModalOpen(false);
          setSelectedStudentForFines(null);
        }}
      >
        {selectedStudentForFines && (
          <StudentFines
            studentData={selectedStudentForFines}
            onClose={() => {
              setIsFinesModalOpen(false);
              setSelectedStudentForFines(null);
            }}
            currentUserRole={currentUser?.role}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
      >
        <div className="p-5 w-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Confirm to delete the selected row
            {selectedRows.length > 1 ? "s" : ""}
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Are you sure you want to delete {selectedRows.length} selected row
            {selectedRows.length > 1 ? "s" : ""}? <br /> This action cannot be
            undone.
          </p>

          <div className="flex items-start gap-2 mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <input
              type="checkbox"
              id="delete-confirm"
              checked={deleteConfirmChecked}
              onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
              className="mt-0.5 h-3 w-3 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="delete-confirm" className="text-xs text-red-700">
              I understand that this action will permanently delete{" "}
              {selectedRows.length} selected row
              {selectedRows.length > 1 ? "s" : ""} from the database. This data
              cannot be recovered once deleted. I confirm that I have verified
              the selection and take full responsibility for this action.
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setIsDeleteConfirmModalOpen(false);
                setDeleteConfirmChecked(false);
              }}
              label="Cancel"
              variant="secondary"
            />
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-400 !text-white !border-red-500 hover:bg-red-500 !hover:border-red-500 !hover:text-white"
              label="Delete"
              variant="danger"
              disabled={!deleteConfirmChecked}
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Attendance Confirmation Modal */}
      <Modal
        isOpen={isBulkAttendanceModalOpen}
        onClose={() => {
          setIsBulkAttendanceModalOpen(false);
          setBulkAttendanceConfirmChecked(false);
        }}
      >
        <div className="p-5 w-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Confirm bulk attendance update
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Are you sure you want to mark {selectedRows.length} selected student
            {selectedRows.length > 1 ? "s" : ""} as{" "}
            <span className="font-semibold capitalize">
              {bulkAttendanceStatus}
            </span>
            ?
          </p>

          <div className="flex items-start gap-2 mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <input
              type="checkbox"
              id="bulk-attendance-confirm"
              checked={bulkAttendanceConfirmChecked}
              onChange={(e) =>
                setBulkAttendanceConfirmChecked(e.target.checked)
              }
              className="mt-0.5 h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="bulk-attendance-confirm"
              className="text-xs text-blue-700"
            >
              I understand that this action will update the attendance status
              for {selectedRows.length} selected student
              {selectedRows.length > 1 ? "s" : ""} to{" "}
              <span className="font-semibold capitalize">
                {bulkAttendanceStatus}
              </span>
              . I confirm that I have verified the selection and take
              responsibility for this action.
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setIsBulkAttendanceModalOpen(false);
                setBulkAttendanceConfirmChecked(false);
              }}
              label="Cancel"
              variant="secondary"
            />
            <Button
              onClick={handleConfirmBulkAttendance}
              className="!bg-blue-500 !text-white !border-blue-500 hover:!bg-blue-600 hover:!border-blue-600 hover:!text-white"
              label={`Mark as ${bulkAttendanceStatus}`}
              variant="primary"
              disabled={!bulkAttendanceConfirmChecked}
            />
          </div>
        </div>
      </Modal>

      {/* Rows Per Page Dropdown */}
      {isRowsModalOpen && (
        <div
          ref={rowsDropdownRef}
          className="fixed bg-white border border-border-dark rounded-md shadow-lg z-[9999] p-1"
          style={{
            top: `${rowsDropdownPosition.top}px`,
            left: `${rowsDropdownPosition.left}px`,
          }}
        >
          <div className="flex flex-col">
            <button
              onClick={() => handleRowsPerPageChange(100)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-xs"
            >
              100 rows
            </button>
            <button
              onClick={() => handleRowsPerPageChange(500)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-xs"
            >
              500 rows
            </button>
            <button
              onClick={() => handleRowsPerPageChange(1000)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-xs"
            >
              1000 rows
            </button>
            <button
              onClick={() => handleRowsPerPageChange(5000)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-xs"
            >
              5000 rows
            </button>
            <button
              onClick={() => handleRowsPerPageChange(10000)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-xs"
            >
              10000 rows
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
