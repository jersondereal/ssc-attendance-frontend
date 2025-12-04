import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import axios from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "../components/common/Button/Button";
import { DropdownSelector } from "../components/common/DropdownSelector/DropdownSelector";
import {
  EventSelector,
  type Event,
} from "../components/common/EventSelector/EventSelector";
import { Modal } from "../components/common/Modal/Modal";
import { SearchBar } from "../components/common/SearchBar/SearchBar";
import type { TableRecord } from "../components/common/Table/Table";
import { Table } from "../components/common/Table/Table";
import { AddStudentForm } from "../components/forms/AddStudentForm/AddStudentForm";
import { EditStudentForm } from "../components/forms/EditStudentForm/EditStudentForm";
import { Metrics } from "../components/ui/Metrics/Metrics";
import { StudentFines } from "../components/ui/StudentFines/StudentFines";
import config from "../config";
import { useToast } from "../contexts/ToastContext";

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
  courses?: {
    all: boolean;
    bsit: boolean;
    bshm: boolean;
    bscrim: boolean;
  };
  sections?: {
    all: boolean;
    a: boolean;
    b: boolean;
    c: boolean;
    d: boolean;
  };
  school_years?: {
    all: boolean;
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface AttendancePageProps {
  tableType: "attendance" | "students";
  currentUser: {
    username: string;
    role: string;
  } | null;
}

export function AttendancePage({
  tableType,
  currentUser,
}: AttendancePageProps) {
  const { showToast } = useToast();
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
                `${row.name} (${
                  row.studentId
                }) is marked as ${row.status.toLowerCase()}`,
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
        rfid: data.rfid.trim(),
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

  const handleEditStudentSubmit = async (data: {
    studentId: string;
    name: string;
    course: string;
    year: string;
    section: string;
    rfid?: string;
  }) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/students/${data.studentId}`,
        {
          name: data.name,
          course: data.course.toLowerCase(),
          year: data.year,
          section: data.section.toLowerCase(),
          rfid: data.rfid?.trim() || null,
        }
      );

      const updatedStudent = response.data;

      // Update local state with the updated student data
      const updatedStudentData = {
        studentId: updatedStudent.student_id,
        name: updatedStudent.name,
        course: updatedStudent.course.toUpperCase(),
        year: updatedStudent.year,
        section: updatedStudent.section.toUpperCase(),
        rfid: updatedStudent.rfid,
      };

      if (tableType === "attendance") {
        setAttendanceData((prevData) =>
          prevData.map((item) =>
            item.studentId === data.studentId
              ? { ...item, ...updatedStudentData }
              : item
          )
        );
      } else {
        setStudents((prevData) =>
          prevData.map((item) =>
            item.studentId === data.studentId
              ? { ...item, ...updatedStudentData }
              : item
          )
        );
      }

      showToast(
        `Student ${updatedStudent.name} updated successfully`,
        "success"
      );
      setIsEditStudentModalOpen(false);
      setEditingStudent(null);
    } catch (error: unknown) {
      console.error("Error updating student:", error);
      if (axios.isAxiosError(error)) {
        showToast(
          error.response?.data?.message || "Failed to update student",
          "error"
        );
      } else {
        showToast("Failed to update student", "error");
      }
    }
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
    courses?: {
      all: boolean;
      bsit: boolean;
      bshm: boolean;
      bscrim: boolean;
    };
    sections?: {
      all: boolean;
      a: boolean;
      b: boolean;
      c: boolean;
      d: boolean;
    };
    schoolYears?: {
      all: boolean;
      1: boolean;
      2: boolean;
      3: boolean;
      4: boolean;
    };
  }) => {
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/events/`,
        eventData
      );
      const newEvent = response.data;

      setEvents((prevEvents) => [...prevEvents, newEvent]);
      showToast(`Event "${newEvent.title}" created successfully`);
    } catch (error) {
      console.error("Error creating event:", error);
      showToast("Failed to create event");
    }
  };

  const handleEditEvent = async (
    event: Event & {
      courses?: {
        all: boolean;
        bsit: boolean;
        bshm: boolean;
        bscrim: boolean;
      };
      sections?: {
        all: boolean;
        a: boolean;
        b: boolean;
        c: boolean;
        d: boolean;
      };
      schoolYears?: {
        all: boolean;
        1: boolean;
        2: boolean;
        3: boolean;
        4: boolean;
      };
    }
  ) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/events/${event.id}`,
        {
          title: event.name,
          event_date: event.date,
          location: event.location,
          fine: event.fine,
          courses: event.courses,
          sections: event.sections,
          schoolYears: event.schoolYears,
        }
      );
      const updatedEvent = response.data;

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

      setEvents((prevEvents) =>
        prevEvents.filter((e) => e.id.toString() !== eventId)
      );

      if (selectedEvent?.id === eventId) {
        setSelectedEvent(undefined);
      }

      showToast("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Failed to delete event");
    }
  };

  const handleRfidSubmit = async (rfid: string) => {
    if (!selectedEvent) {
      showToast("Please select an event first", "error");
      return;
    }

    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/attendance/rfid/${rfid}/${selectedEvent.id}`,
        { status: "present" }
      );

      const studentData = response.data;

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
          const updated = [...prev];
          updated[existingIndex] = newAttendanceRecord;
          return updated;
        } else {
          return [...prev, newAttendanceRecord];
        }
      });

      showToast(`${studentData.student.name} marked as present`, "success");
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

  const handleDownload = () => {
    const data = getFilteredData();
    const sortedData = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof TableRecord];
      const bValue = b[sortConfig.key as keyof TableRecord];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      tableType === "attendance" ? "Attendance" : "Students"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tableType}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast(`Exported ${sortedData.length} records to Excel`, "success");
  };

  const getFilteredData = useCallback(() => {
    const data = tableType === "attendance" ? attendanceData : students;

    return data.filter((item) => {
      const searchMatch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course.toLowerCase().includes(searchQuery.toLowerCase());

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
  }, [tableType, attendanceData, students, selectedFilters, searchQuery]);

  const filteredData = getFilteredData();
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof TableRecord];
    const bValue = b[sortConfig.key as keyof TableRecord];

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    handlePageChange(newPage);
  };

  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages);
    handlePageChange(newPage);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setPageInputValue(newPage.toString());

    const isAllSelected =
      tableType === "attendance"
        ? selectedRows.length === totalAttendance
        : selectedRows.length === totalStudents;

    if (!isAllSelected) {
      setSelectedRows([]);
    }
  };

  const handleRowsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setIsRowsModalOpen(false);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = parseInt(e.currentTarget.value);
      if (value && value >= 1 && value <= totalPages) {
        handlePageChange(value);
      } else {
        handlePageChange(1);
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

  useEffect(() => {
    setCurrentPage(1);
    setPageInputValue("1");
  }, [selectedFilters, searchQuery, tableType]);

  useEffect(() => {
    setSelectedRows([]);
  }, [tableType]);

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

    const filterName = filterType.charAt(0).toUpperCase() + filterType.slice(1);
    const filterValue = value === "all" ? "All" : value.toUpperCase();
    showToast(`${filterName} filter set to ${filterValue}`, "info");
  };

  const handleDeleteSelected = () => {
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const isAllSelected = selectedRows.length === filteredData.length;

    const selectedData = isAllSelected
      ? filteredData
      : selectedRows.map((index) => currentData[index]);

    const studentIds = selectedData.map((student) => student.studentId);

    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/students/bulk`,
        {
          data: { studentIds },
        }
      );

      if (tableType === "students") {
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
    const isAllSelected = selectedRows.length === filteredData.length;

    const selectedData = isAllSelected
      ? filteredData
      : selectedRows.map((index) => currentData[index]);

    const studentIds = selectedData.map((student) => student.studentId);

    if (!selectedEvent) {
      showToast("Please select an event first", "error");
      return;
    }

    try {
      const updatePromises = studentIds.map((studentId) =>
        axios.put(
          `${config.API_BASE_URL}/attendance/${studentId}/${selectedEvent.id}`,
          { status: bulkAttendanceStatus }
        )
      );

      await Promise.all(updatePromises);

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
      top: rect.top + window.scrollY - 175,
      left: rect.left + window.scrollX,
    });
    setIsRowsModalOpen(!isRowsModalOpen);
  };

  return (
    <div className="w-full !h-full px-5">
      {/* Menu bar container  */}
      <div className="flex flex-row w-full max-w-[60rem] mx-auto mb-3 z-100 items-end ">
        {selectedRows.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 ">
            <div className="flex flex-row gap-2">
              <Button
                onClick={handleDownload}
                variant="primary"
                title="Export Table Data"
                label="Export"
              />
              {tableType === "students" && (
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

              {tableType === "attendance" && (
                <>
                  <Button
                    label="Present"
                    variant="primary"
                    onClick={() => {
                      setBulkAttendanceStatus("Present");
                      setIsBulkAttendanceModalOpen(true);
                    }}
                  />
                  <Button
                    label="Absent"
                    variant="primary"
                    onClick={() => {
                      setBulkAttendanceStatus("Absent");
                      setIsBulkAttendanceModalOpen(true);
                    }}
                  />
                  <Button
                    label="Excused"
                    variant="primary"
                    onClick={() => {
                      setBulkAttendanceStatus("Excused");
                      setIsBulkAttendanceModalOpen(true);
                    }}
                  />
                </>
              )}
            </div>
            {tableType === "attendance" && (
              <Button
                label={
                  selectedRows.length === filteredData.length
                    ? `All ${filteredData.length} rows in this attendance are selected.`
                    : `Select all ${filteredData.length} rows`
                }
                variant="secondary"
                className={
                  selectedRows.length === filteredData.length
                    ? "!text-blue-600"
                    : ""
                }
                onClick={() => {
                  if (selectedRows.length === filteredData.length) {
                    setSelectedRows([]);
                  } else {
                    const allIndices = filteredData.map((_, index) => index);
                    setSelectedRows(allIndices);
                  }
                }}
              />
            )}
            {tableType === "students" && (
              <Button
                label={
                  selectedRows.length === filteredData.length
                    ? `All ${filteredData.length} rows in this table are selected.`
                    : `Select all ${filteredData.length} rows`
                }
                variant="secondary"
                className={
                  selectedRows.length === filteredData.length
                    ? "!text-blue-600"
                    : ""
                }
                onClick={() => {
                  if (selectedRows.length === filteredData.length) {
                    setSelectedRows([]);
                  } else {
                    const allIndices = filteredData.map((_, index) => index);
                    setSelectedRows(allIndices);
                  }
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex md:flex-row flex-col mr-0 sm:mr-3 gap-y-2">
            {/* Date and Event Group */}
            <div className={`flex flex-row`}>
              {tableType === "attendance" ? (
                <div className="flex flex-row gap-3 items-center">
                  {currentUser?.role !== "Viewer" && (
                    <Button
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
                      courses: event.courses,
                      sections: event.sections,
                      schoolYears: event.school_years,
                    }))}
                    onAddEvent={handleAddEvent}
                    onEditEvent={handleEditEvent}
                    onDeleteEvent={handleDeleteEvent}
                    currentUserRole={currentUser?.role}
                  />
                </div>
              ) : (
                <Button
                  className="mr-3"
                  onClick={handleAddStudent}
                  label="Register New Student"
                  variant="primary"
                  title="Add New Student"
                />
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
      {tableType === "attendance" ? (
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
          totalRecords={totalAttendance}
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
          totalRecords={totalStudents}
        />
      )}

      {/* Pagination */}
      <div className="flex flex-row max-w-[60rem] mx-auto items-center justify-end text-xs text-zinc-500 mt-3">
        <div className="flex flex-row mr-4 items-center gap-4">
          <div>
            {tableType === "attendance" ? totalAttendance : totalStudents}{" "}
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
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ArrowRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* RFID Check-in Modal */}
      <Modal isOpen={isRfidModalOpen} onClose={() => setIsRfidModalOpen(false)}>
        <div
          className="p-6 text-center"
          onClick={(e) => {
            const input = e.currentTarget.querySelector("input");
            input?.focus();
          }}
        >
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
                e.currentTarget.value = "";
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
              onClick={() => handleRowsPerPageChange(20)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-xs"
            >
              20 rows
            </button>
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
          </div>
        </div>
      )}
    </div>
  );
}
