import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { AttendanceBulkActionsBar } from "../components/attendance/AttendanceBulkActionsBar";
import { AttendanceControls } from "../components/attendance/AttendanceControls";
import { BulkAttendanceModal } from "../components/attendance/BulkAttendanceModal";
import { DeleteConfirmationModal } from "../components/attendance/DeleteConfirmationModal";
import { QrCheckInModal } from "../components/attendance/QrCheckInModal";
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
import { RegistrationSuccessView } from "../components/shared";
import { StudentProfileCard } from "../components/ui/StudentProfileCard/StudentProfileCard";
import config from "../config";
import { useToast } from "../contexts/ToastContext";
import type {
  AttendanceRecord,
  DBAttendance,
  DBStudent,
  StudentRecord,
} from "../stores/types";
import { useAuthStore } from "../stores/useAuthStore";
import { useAttendanceStore } from "../stores/useAttendanceStore";
import { useCollegesStore } from "../stores/useCollegesStore";
import { useEventsStore } from "../stores/useEventsStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useStudentsStore } from "../stores/useStudentsStore";

interface AttendancePageProps {
  tableType: "attendance" | "students";
}

export function AttendancePage({ tableType }: AttendancePageProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { showToast } = useToast();
  const systemSettings = useSettingsStore((s) => s.systemSettings);
  const location = useLocation();
  const navigate = useNavigate();

  const events = useEventsStore((s) => s.events);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const addEventToStore = useEventsStore((s) => s.addEvent);
  const updateEventInStore = useEventsStore((s) => s.updateEvent);
  const removeEventFromStore = useEventsStore((s) => s.removeEvent);

  const students = useStudentsStore((s) => s.students);
  const fetchStudents = useStudentsStore((s) => s.fetchStudents);
  const addStudentToStore = useStudentsStore((s) => s.addStudent);
  const updateStudentInStore = useStudentsStore((s) => s.updateStudent);
  const removeStudentsFromStore = useStudentsStore((s) => s.removeStudents);

  const collegeOptions = useCollegesStore((s) => s.collegeOptions);
  const fetchColleges = useCollegesStore((s) => s.fetchColleges);

  const selectedEvent = useAttendanceStore((s) => s.selectedEvent);
  const attendanceByEventId = useAttendanceStore((s) => s.attendanceByEventId);
  const selectedFilters = useAttendanceStore((s) => s.selectedFilters);
  const searchQuery = useAttendanceStore((s) => s.searchQuery);
  const sortConfig = useAttendanceStore((s) => s.sortConfig);
  const selectedRows = useAttendanceStore((s) => s.selectedRows);
  const selectedStudentForProfile = useAttendanceStore(
    (s) => s.selectedStudentForProfile
  );
  const editingStudent = useAttendanceStore((s) => s.editingStudent);
  const setSelectedEvent = useAttendanceStore((s) => s.setSelectedEvent);
  const setAttendanceForEvent = useAttendanceStore((s) => s.setAttendanceForEvent);
  const updateAttendanceRecord = useAttendanceStore(
    (s) => s.updateAttendanceRecord
  );
  const setSelectedFilters = useAttendanceStore((s) => s.setSelectedFilters);
  const setSearchQuery = useAttendanceStore((s) => s.setSearchQuery);
  const setSortConfig = useAttendanceStore((s) => s.setSortConfig);
  const setSelectedRows = useAttendanceStore((s) => s.setSelectedRows);
  const setSelectedStudentForProfile = useAttendanceStore(
    (s) => s.setSelectedStudentForProfile
  );
  const setEditingStudent = useAttendanceStore((s) => s.setEditingStudent);
  const isQrModalOpen = useAttendanceStore((s) => s.isQrModalOpen);
  const setIsQrModalOpen = useAttendanceStore((s) => s.setIsQrModalOpen);
  const isAddStudentModalOpen = useAttendanceStore(
    (s) => s.isAddStudentModalOpen
  );
  const setIsAddStudentModalOpen = useAttendanceStore(
    (s) => s.setIsAddStudentModalOpen
  );
  const isEditStudentModalOpen = useAttendanceStore(
    (s) => s.isEditStudentModalOpen
  );
  const [addedStudent, setAddedStudent] = useState<DBStudent | null>(null);

  const setIsEditStudentModalOpen = useAttendanceStore(
    (s) => s.setIsEditStudentModalOpen
  );
  const isDeleteConfirmModalOpen = useAttendanceStore(
    (s) => s.isDeleteConfirmModalOpen
  );
  const setIsDeleteConfirmModalOpen = useAttendanceStore(
    (s) => s.setIsDeleteConfirmModalOpen
  );
  const deleteConfirmChecked = useAttendanceStore(
    (s) => s.deleteConfirmChecked
  );
  const setDeleteConfirmChecked = useAttendanceStore(
    (s) => s.setDeleteConfirmChecked
  );
  const isBulkAttendanceModalOpen = useAttendanceStore(
    (s) => s.isBulkAttendanceModalOpen
  );
  const setIsBulkAttendanceModalOpen = useAttendanceStore(
    (s) => s.setIsBulkAttendanceModalOpen
  );
  const bulkAttendanceStatus = useAttendanceStore(
    (s) => s.bulkAttendanceStatus
  );
  const setBulkAttendanceStatus = useAttendanceStore(
    (s) => s.setBulkAttendanceStatus
  );
  const bulkAttendanceConfirmChecked = useAttendanceStore(
    (s) => s.bulkAttendanceConfirmChecked
  );
  const setBulkAttendanceConfirmChecked = useAttendanceStore(
    (s) => s.setBulkAttendanceConfirmChecked
  );

  const attendanceData = useMemo(
    () =>
      selectedEvent
        ? attendanceByEventId[selectedEvent.id] ?? []
        : [],
    [selectedEvent, attendanceByEventId]
  );

  const mapAttendanceRows = useCallback(
    (rows: DBAttendance[]): AttendanceRecord[] =>
      rows.map((record) => ({
        studentId: record.student_id,
        name: record.name,
        college: (record.college ?? record.course ?? "").toUpperCase(),
        year: record.year,
        section: record.section.toUpperCase(),
        status: record.status,
      })),
    []
  );

  useEffect(() => {
    if (events.length === 0) fetchEvents();
  }, [events.length, fetchEvents]);

  useEffect(() => {
    if (students.length === 0) fetchStudents();
  }, [students.length, fetchStudents]);

  // Open profile card from URL param ?student=<id> (on students page only)
  useEffect(() => {
    if (tableType !== "students" || students.length === 0) return;
    const params = new URLSearchParams(location.search);
    const studentId = params.get("student");
    if (!studentId) return;
    const match = students.find((s) => s.studentId === studentId);
    if (match) setSelectedStudentForProfile(match);
  }, [tableType, students, location.search, setSelectedStudentForProfile]);

  useEffect(() => {
    if (collegeOptions.length <= 1) fetchColleges();
  }, [collegeOptions.length, fetchColleges]);

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
        sections: match.sections as Event["sections"],
        schoolYears: match.school_years as Event["schoolYears"],
      });
    }
    navigate("/attendance", { replace: true, state: {} });
  }, [events, location.state, navigate, setSelectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return;
    const cached = attendanceByEventId[selectedEvent.id];
    if (cached !== undefined) return;
    axios
      .get(`${config.API_BASE_URL}/attendance/event/${selectedEvent.id}`)
      .then((res) => {
        const mapped = mapAttendanceRows(res.data as DBAttendance[]);
        setAttendanceForEvent(selectedEvent.id, mapped);
      })
      .catch((err) => console.error(err));
  }, [selectedEvent, attendanceByEventId, setAttendanceForEvent, mapAttendanceRows]);

  const handleTableAction = (action: string, row: TableRecord) => {
    switch (action) {
      case "status":
        if ("status" in row && selectedEvent) {
          updateAttendanceRecord(
            selectedEvent.id,
            row.studentId,
            row as AttendanceRecord
          );
          axios
            .put(
              `${config.API_BASE_URL}/attendance/${row.studentId}/${selectedEvent.id}`,
              { status: row.status }
            )
            .then(() => {
              showToast(
                `${row.name} (${row.studentId}) is marked as ${row.status.toLowerCase()}`,
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
    }
  };

  const handleAddStudent = () => {
    setIsAddStudentModalOpen(true);
  };

  const uploadProfileImage = async (file: File, year: string) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("year", year);
    const response = await axios.post<{ url: string }>(
      `${config.API_BASE_URL}/upload/profile-image`,
      formData
    );
    const imageUrl = response.data?.url;
    if (!imageUrl) {
      throw new Error("Image upload failed");
    }
    return { imageUrl };
  };

  const handleAddStudentSubmit = async (data: StudentFormData) => {
    try {
      let profileImageUrl: string | null = null;
      if (data.profileImageFile) {
        const uploaded = await uploadProfileImage(data.profileImageFile, data.year);
        profileImageUrl = uploaded.imageUrl;
      }
      const response = await axios.post(`${config.API_BASE_URL}/students`, {
        student_id: data.studentId,
        name: data.name,
        college: data.college.toLowerCase(),
        year: data.year,
        section: data.section.toLowerCase(),
        rfid: (data.rfid ?? "").trim(),
        profile_image_url: profileImageUrl,
      });

      const newStudent = response.data as DBStudent;
      addStudentToStore(newStudent);
      setAddedStudent(newStudent);
      showToast(`Student ${newStudent.name} added successfully`, "success");
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
      const existingStudent = students.find((s) => s.studentId === data.studentId);
      let profileImageUrl =
        data.profileImageUrl ?? existingStudent?.profileImageUrl ?? null;
      if (data.profileImageFile) {
        const uploaded = await uploadProfileImage(data.profileImageFile, data.year);
        profileImageUrl = uploaded.imageUrl;
      }
      const response = await axios.put(
        `${config.API_BASE_URL}/students/${data.studentId}`,
        {
          name: data.name,
          college: data.college.toLowerCase(),
          year: data.year,
          section: data.section.toLowerCase(),
          rfid: data.rfid?.trim() || null,
          profile_image_url: profileImageUrl,
        }
      );

      const updatedStudent = response.data;

      // Update local state with the updated student data
      updateStudentInStore(data.studentId, updatedStudent);

      if (tableType === "attendance" && selectedEvent) {
        const list = attendanceByEventId[selectedEvent.id] ?? [];
        const mapped = list.map((item) =>
          item.studentId === data.studentId
            ? {
                ...item,
                studentId: updatedStudent.student_id,
                name: updatedStudent.name,
                college: (
                  updatedStudent.college ??
                  updatedStudent.course ??
                  ""
                ).toUpperCase(),
                year: updatedStudent.year,
                section: updatedStudent.section.toUpperCase(),
              }
            : item
        );
        setAttendanceForEvent(selectedEvent.id, mapped);
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
      addEventToStore(newEvent);
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
      updateEventInStore(event.id, updatedEvent);

      if (selectedEvent?.id === event.id) {
        const nextSelectedEvent: Event = {
          id: updatedEvent.id.toString(),
          name: updatedEvent.title,
          date: updatedEvent.event_date,
          location: updatedEvent.location,
          fine: updatedEvent.fine,
          colleges: updatedEvent.colleges ?? updatedEvent.courses,
          sections: updatedEvent.sections as Event["sections"],
          schoolYears: updatedEvent.school_years as Event["schoolYears"],
        };
        setSelectedEvent(nextSelectedEvent);

        const attendanceResponse = await axios.get(
          `${config.API_BASE_URL}/attendance/event/${event.id}`
        );
        setAttendanceForEvent(
          event.id,
          mapAttendanceRows(attendanceResponse.data as DBAttendance[])
        );
      }

      showToast(`Event "${updatedEvent.title}" updated successfully`);
    } catch (error) {
      console.error("Error updating event:", error);
      showToast("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/events/${eventId}`);
      removeEventFromStore(eventId);
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(undefined);
      }
      showToast("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Failed to delete event");
    }
  };

  const handleQrScanSubmit = useCallback(
    async (studentId: string) => {
      if (!selectedEvent) {
        showToast("Please select an event first", "error");
        return;
      }

      try {
        const cleanedId = studentId.trim();
        if (!cleanedId) return;

        await axios.put(
          `${config.API_BASE_URL}/attendance/${cleanedId}/${selectedEvent.id}`,
          { status: "Present" }
        );

        let student = students.find((s) => s.studentId === cleanedId);
        if (!student) {
          const response = await axios.get(
            `${config.API_BASE_URL}/students/${cleanedId}`
          );
          const fetched = response.data as DBStudent;
          student = {
            studentId: fetched.student_id,
            name: fetched.name,
            college: (fetched.college ?? fetched.course ?? "").toUpperCase(),
            year: fetched.year,
            section: fetched.section.toUpperCase(),
            rfid: fetched.rfid,
            profileImageUrl: fetched.profile_image_url ?? null,
          };
        }

        const newAttendanceRecord: AttendanceRecord = {
          studentId: student?.studentId ?? cleanedId,
          name: student?.name ?? cleanedId,
          college: student?.college ?? "",
          year: student?.year ?? "",
          section: student?.section ?? "",
          status: "Present",
        };

        if (selectedEvent) {
          const prev = attendanceByEventId[selectedEvent.id] ?? [];
          const existingIndex = prev.findIndex(
            (a) => a.studentId === cleanedId
          );
          const next =
            existingIndex >= 0
              ? prev.map((a, i) =>
                  i === existingIndex ? newAttendanceRecord : a
                )
              : [...prev, newAttendanceRecord];
          setAttendanceForEvent(selectedEvent.id, next);
        }

        showToast(`${newAttendanceRecord.name} marked as present`, "success");
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
    },
    [
      selectedEvent,
      showToast,
      students,
      attendanceByEventId,
      setAttendanceForEvent,
    ]
  );

  const attendanceColumns = [
    { key: "studentId", label: "Id", width: "90px" },
    { key: "name", label: "Name", width: "100px" },
    { key: "status", label: "Status", width: "80px" },
    { key: "college", label: "College", width: "70px" },
    { key: "year", label: "Year", width: "70px" },
    { key: "section", label: "Section", width: "80px" },
  ];

  const studentColumns = [
    { key: "studentId", label: "Id", width: "90px" },
    // { key: "rfid", label: "Rfid", width: "100px" },
    { key: "name", label: "Name", width: "80px" },
    { key: "college", label: "College", width: "80px" },
    { key: "year", label: "Year", width: "80px" },
    { key: "section", label: "Section", width: "80px" },
  ];

  const yearOptions = useMemo(
    () => [
      { value: "all", label: "All Years" },
      { value: "1", label: "Year 1" },
      { value: "2", label: "Year 2" },
      { value: "3", label: "Year 3" },
      { value: "4", label: "Year 4" },
    ],
    []
  );

  const scopedCollegeOptions = useMemo(() => {
    if (tableType !== "attendance" || !selectedEvent?.colleges) {
      return collegeOptions;
    }

    const selectedColleges = Object.entries(selectedEvent.colleges)
      .filter(([key, enabled]) => key !== "all" && enabled)
      .map(([key]) => key.toLowerCase());

    if (selectedEvent.colleges.all || selectedColleges.length === 0) {
      return collegeOptions;
    }

    const selectedCollegeSet = new Set(selectedColleges);
    const filtered = collegeOptions.filter(
      (option) =>
        option.value === "all" || selectedCollegeSet.has(option.value.toLowerCase())
    );

    return filtered.length > 1 ? filtered : collegeOptions;
  }, [tableType, selectedEvent, collegeOptions]);

  const scopedYearOptions = useMemo(() => {
    if (tableType !== "attendance" || !selectedEvent?.schoolYears) {
      return yearOptions;
    }

    const selectedYears = Object.entries(selectedEvent.schoolYears)
      .filter(([key, enabled]) => key !== "all" && enabled)
      .map(([key]) => key);

    if (selectedEvent.schoolYears.all || selectedYears.length === 0) {
      return yearOptions;
    }

    const selectedYearSet = new Set(selectedYears);
    return yearOptions.filter(
      (option) => option.value === "all" || selectedYearSet.has(option.value)
    );
  }, [tableType, selectedEvent, yearOptions]);

  useEffect(() => {
    const validCollegeValues = new Set(scopedCollegeOptions.map((o) => o.value));
    const validYearValues = new Set(scopedYearOptions.map((o) => o.value));

    setSelectedFilters((prev) => ({
      ...prev,
      college: validCollegeValues.has(prev.college) ? prev.college : "all",
      year: validYearValues.has(prev.year) ? prev.year : "all",
    }));
  }, [scopedCollegeOptions, scopedYearOptions, setSelectedFilters]);

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
  }, [tableType, setSelectedRows]);

  const handleFilterChange = (
    filterType: "college" | "year" | "section",
    value: string
  ) => {
    setSelectedFilters((prev) => ({ ...prev, [filterType]: value }));
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
        removeStudentsFromStore(studentIds);
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

      if (selectedEvent) {
        const prev = attendanceByEventId[selectedEvent.id] ?? [];
        const next = prev.map((item) =>
          studentIds.includes(item.studentId)
            ? { ...item, status: bulkAttendanceStatus }
            : item
        );
        setAttendanceForEvent(selectedEvent.id, next);
      }

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
    (): Event[] =>
      events.map((event) => ({
        id: event.id.toString(),
        name: event.title,
        date: event.event_date,
        location: event.location,
        fine: event.fine,
        colleges: event.colleges,
        sections: event.sections as Event["sections"],
        schoolYears: event.school_years as Event["schoolYears"],
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
    <div className="w-full !h-full px-5 pb-10">
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
            onQRScanClick={() => setIsQrModalOpen(true)}
            onAddStudent={handleAddStudent}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            collegeOptions={scopedCollegeOptions}
            yearOptions={scopedYearOptions}
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
          onRowClick={(row) => {
            if ("studentId" in row && !("status" in row)) {
              setSelectedStudentForProfile(row as StudentRecord);
              navigate(`/students?student=${(row as StudentRecord).studentId}`, { replace: true });
            }
          }}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          currentUserRole={currentUser?.role}
          tableType="students"
        />
      )}

      {/* QR Check-in Modal */}
      <QrCheckInModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScan={handleQrScanSubmit}
      />

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => {
          setIsAddStudentModalOpen(false);
          setAddedStudent(null);
        }}
        modalClassName="!max-w-[44rem] max-h-[80vh] overflow-y-auto"
      >
        {addedStudent ? (
          <RegistrationSuccessView
            student={addedStudent}
            onDone={() => {
              setIsAddStudentModalOpen(false);
              setAddedStudent(null);
            }}
            doneLabel="Done"
            className="p-6"
          />
        ) : (
          <AddStudentForm
            onSubmit={handleAddStudentSubmit}
            onCancel={() => setIsAddStudentModalOpen(false)}
          />
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setEditingStudent(null);
        }}
        modalClassName="!max-w-[44rem] max-h-[80vh] overflow-y-auto"
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

      {/* Student profile (metrics + fines) modal – opened by row click */}
      <Modal
        modalClassName="!w-fit !max-w-fit !max-h-[90vh] overflow-y-auto !rounded-[20px]"
        isOpen={selectedStudentForProfile !== null}
        onClose={() => {
          setSelectedStudentForProfile(null);
          navigate("/students", { replace: true });
        }}
      >
        {selectedStudentForProfile && (
          <StudentProfileCard
            studentData={selectedStudentForProfile}
            onClose={() => {
              setSelectedStudentForProfile(null);
              navigate("/students", { replace: true });
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
