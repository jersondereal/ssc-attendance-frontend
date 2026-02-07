import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { collegesToOptions, getColleges } from "../api/colleges";
import { AttendanceBulkActionsBar } from "../components/attendance/AttendanceBulkActionsBar";
import { AttendanceControls } from "../components/attendance/AttendanceControls";
import { BulkAttendanceModal } from "../components/attendance/BulkAttendanceModal";
import { DeleteConfirmationModal } from "../components/attendance/DeleteConfirmationModal";
import { RfidCheckInModal } from "../components/attendance/RfidCheckInModal";
import type {
  AddEventData,
  Event,
} from "../components/common/EventSelector/types";
import { Modal } from "../components/common/Modal/Modal";
import type { TableRecord } from "../components/common/Table/Table";
import { Table } from "../components/common/Table/Table";
import { AddStudentForm } from "../components/forms/AddStudentForm/AddStudentForm";
import { EditStudentForm } from "../components/forms/EditStudentForm/EditStudentForm";
import type { StudentFormData } from "../components/forms/StudentForm/StudentForm";
import { Metrics } from "../components/ui/Metrics/Metrics";
import { StudentFines } from "../components/ui/StudentFines/StudentFines";
import config from "../config";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../contexts/ToastContext";

interface AttendanceRecord {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  status: string;
}

interface StudentRecord {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  rfid?: string;
}

interface DBStudent {
  id: number;
  student_id: string;
  name: string;
  college?: string;
  course?: string;
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
  college?: string;
  course?: string;
  year: string;
  section: string;
}

interface DBEvent {
  id: number;
  title: string;
  event_date: string;
  location: string;
  fine: number;
  colleges?: {
    all: boolean;
    bsit: boolean;
    bshm: boolean;
    bscrim: boolean;
  };
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
  const { systemSettings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    college: "all",
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

  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [collegeOptions, setCollegeOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Colleges" }]);

  // Fetch colleges for filter dropdown
  useEffect(() => {
    getColleges()
      .then((list) =>
        setCollegeOptions([
          { value: "all", label: "All Colleges" },
          ...collegesToOptions(list),
        ])
      )
      .catch(() =>
        setCollegeOptions([{ value: "all", label: "All Colleges" }])
      );
  }, []);

  // Fetch students from database
  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/students`)
      .then((res) => {
        const mappedStudents = res.data.map((student: DBStudent) => ({
          studentId: student.student_id,
          name: student.name,
          college: (student.college ?? student.course ?? "").toUpperCase(),
          year: student.year,
          section: student.section.toUpperCase(),
          rfid: student.rfid,
        }));
        setStudents(mappedStudents);
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

  // Pre-select event when navigating from Overview with state.eventId
  useEffect(() => {
    const eventId = (location.state as { eventId?: string } | null)?.eventId;
    if (!eventId || events.length === 0) return;
    const match = events.find((e) => e.id.toString() === eventId);
    if (match) {
      setSelectedEvent({
        id: match.id.toString(),
        name: match.title,
        date: match.event_date,
        location: match.location,
        fine: match.fine,
        colleges: match.colleges ?? match.courses,
        sections: match.sections,
        schoolYears: match.school_years,
      });
    }
    navigate("/attendance", { replace: true, state: {} });
  }, [events, location.state, navigate]);

  // Fetch attendance data from database
  useEffect(() => {
    if (selectedEvent) {
      axios
        .get(`${config.API_BASE_URL}/attendance/event/${selectedEvent?.id}`)
        .then((res) => {
          const mappedAttendance = res.data.map((record: DBAttendance) => ({
            studentId: record.student_id,
            name: record.name,
            college: (record.college ?? record.course ?? "").toUpperCase(),
            year: record.year,
            section: record.section.toUpperCase(),
            status: record.status,
          }));

          setAttendanceData(mappedAttendance);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      setAttendanceData([]);
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

  const handleAddStudentSubmit = async (data: StudentFormData) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/students`, {
        student_id: data.studentId,
        name: data.name,
        college: data.college.toLowerCase(),
        year: data.year,
        section: data.section.toLowerCase(),
        rfid: (data.rfid ?? "").trim(),
      });

      const newStudent = response.data;

      // Update local state with the new student
      setStudents((prev) => [
        ...prev,
        {
          studentId: newStudent.student_id,
          name: newStudent.name,
          college: (
            newStudent.college ??
            newStudent.course ??
            ""
          ).toUpperCase(),
          year: newStudent.year,
          section: newStudent.section.toUpperCase(),
          rfid: newStudent.rfid,
        },
      ]);

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

  const handleEditStudentSubmit = async (data: StudentFormData) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/students/${data.studentId}`,
        {
          name: data.name,
          college: data.college.toLowerCase(),
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
        college: (
          updatedStudent.college ??
          updatedStudent.course ??
          ""
        ).toUpperCase(),
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

  const handleAddEvent = async (eventData: AddEventData) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/events/`, {
        ...eventData,
        colleges: eventData.colleges,
      });
      const newEvent = response.data;

      setEvents((prevEvents) => [...prevEvents, newEvent]);
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
          colleges: event.colleges,
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
        college: (
          studentData.student.college ??
          studentData.student.course ??
          ""
        ).toUpperCase(),
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
    { key: "studentId", label: "Id", width: "90px" },
    { key: "name", label: "Name", width: "100px" },
    { key: "status", label: "Status", width: "80px" },
    { key: "college", label: "College", width: "70px" },
    { key: "year", label: "Year", width: "70px" },
    { key: "section", label: "Section", width: "80px" },
  ];

  const studentColumns = [
    { key: "studentId", label: "Id", width: "0" },
    { key: "rfid", label: "Rfid", width: "0" },
    { key: "name", label: "Name", width: "100" },
    { key: "college", label: "College", width: "0" },
    { key: "year", label: "Year", width: "0" },
    { key: "section", label: "Section", width: "0" },
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
        item.college.toLowerCase().includes(searchQuery.toLowerCase());

      const collegeMatch =
        selectedFilters.college === "all" ||
        item.college.toLowerCase() === selectedFilters.college;
      const yearMatch =
        selectedFilters.year === "all" || item.year === selectedFilters.year;
      const sectionMatch =
        selectedFilters.section === "all" ||
        item.section.toLowerCase() === selectedFilters.section;

      return searchMatch && collegeMatch && yearMatch && sectionMatch;
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

  const currentData = sortedData;

  useEffect(() => {
    setSelectedRows([]);
  }, [tableType]);

  const handleFilterChange = (
    filterType: "college" | "year" | "section",
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

  // hasTableData logic for EventSelector: If attendance data loaded and not empty, don't auto-open event selector
  // FIX: Use the same filteredData logic (including filters and search) to determine if user is viewing any rows,
  // since this is what is shown in the table (not raw attendanceData).
  const hasAttendanceTableData = useMemo(() => {
    return (
      tableType === "attendance" &&
      Array.isArray(filteredData) &&
      filteredData.length > 0
    );
  }, [tableType, filteredData]);

  const mappedEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id.toString(),
        name: event.title,
        date: event.event_date,
        location: event.location,
        fine: event.fine,
        colleges: event.colleges,
        sections: event.sections,
        schoolYears: event.school_years,
      })),
    [events]
  );

  const isAllSelected =
    filteredData.length > 0 && selectedRows.length === filteredData.length;

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

  return (
    <div className="w-full !h-full px-5 pb-20">
      {/* Menu bar container  */}
      <div className="flex flex-row w-full max-w-[70rem] mx-auto mb-3 z-100 items-end ">
        {selectedRows.length > 0 ? (
          <AttendanceBulkActionsBar
            tableType={tableType}
            selectedCount={selectedRows.length}
            totalCount={filteredData.length}
            isAllSelected={isAllSelected}
            onExport={handleDownload}
            onDeleteSelected={handleDeleteSelected}
            onBulkStatus={(status) => {
              setBulkAttendanceStatus(status);
              setIsBulkAttendanceModalOpen(true);
            }}
            onToggleSelectAll={() => {
              if (isAllSelected) {
                setSelectedRows([]);
              } else {
                const allIndices = filteredData.map((_, index) => index);
                setSelectedRows(allIndices);
              }
            }}
          />
        ) : (
          <AttendanceControls
            tableType={tableType}
            selectedEvent={selectedEvent}
            events={mappedEvents}
            onEventChange={handleEventChange}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            currentUserRole={currentUser?.role}
            canAddEvent={canAddEvent}
            canEditEvent={canEditEvent}
            canDeleteEvent={canDeleteEvent}
            onRfidClick={() => setIsRfidModalOpen(true)}
            onAddStudent={handleAddStudent}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            collegeOptions={collegeOptions}
            yearOptions={yearOptions}
            sectionOptions={sectionOptions}
            hasAttendanceTableData={hasAttendanceTableData}
          />
        )}
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

      {/* RFID Check-in Modal */}
      <RfidCheckInModal
        isOpen={isRfidModalOpen}
        onClose={() => setIsRfidModalOpen(false)}
        onSubmit={handleRfidSubmit}
      />

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        modalClassName="!max-w-[44rem] max-h-[85vh] overflow-y-auto md:overflow-y-visible"
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
        modalClassName="!max-w-[44rem] max-h-[85vh] overflow-y-auto md:overflow-y-visible"
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
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmModalOpen}
        selectedCount={selectedRows.length}
        confirmChecked={deleteConfirmChecked}
        onConfirmCheckedChange={setDeleteConfirmChecked}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteConfirmModalOpen(false);
          setDeleteConfirmChecked(false);
        }}
      />

      {/* Bulk Attendance Confirmation Modal */}
      <BulkAttendanceModal
        isOpen={isBulkAttendanceModalOpen}
        selectedCount={selectedRows.length}
        status={bulkAttendanceStatus}
        confirmChecked={bulkAttendanceConfirmChecked}
        onConfirmCheckedChange={setBulkAttendanceConfirmChecked}
        onConfirm={handleConfirmBulkAttendance}
        onClose={() => {
          setIsBulkAttendanceModalOpen(false);
          setBulkAttendanceConfirmChecked(false);
        }}
      />
    </div>
  );
}
