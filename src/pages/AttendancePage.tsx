import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { AttendanceBulkActionsBar } from "../components/attendance/AttendanceBulkActionsBar";
import { AttendanceControls } from "../components/attendance/AttendanceControls";
import { AttendanceUpdatePanel } from "../components/attendance/AttendanceUpdatePanel";
import { BulkAttendanceModal } from "../components/attendance/BulkAttendanceModal";
import { DeleteConfirmationModal } from "../components/attendance/DeleteConfirmationModal";
import { QrCheckInModal } from "../components/attendance/QrCheckInModal";
import type { Event } from "../components/common/EventSelector/types";
import { Modal } from "../components/common/Modal/Modal";
import type { TableRecord } from "../components/common/Table/Table";
import { Table } from "../components/common/Table/Table";
import { AddStudentForm } from "../components/forms/AddStudentForm/AddStudentForm";
import { EditStudentForm } from "../components/forms/EditStudentForm/EditStudentForm";
import type { StudentFormData } from "../components/forms/StudentForm/StudentForm";
import { RegistrationSuccessView } from "../components/shared";
import { EasterEggProfileCard } from "../components/ui/EasterEggProfileCard/EasterEggProfileCard";
import { StudentProfileCard } from "../components/ui/StudentProfileCard/StudentProfileCard";
import config from "../config";
import { useToast } from "../contexts/ToastContext";
import type {
  AttendanceRecord,
  DBStudent,
  StudentRecord,
} from "../stores/types";
import { useAuthStore } from "../stores/useAuthStore";
import { useAttendanceStore } from "../stores/useAttendanceStore";
import { useCollegesStore } from "../stores/useCollegesStore";
import { useEventsStore } from "../stores/useEventsStore";
import { useStudentsStore } from "../stores/useStudentsStore";

interface AttendancePageProps {
  tableType: "attendance" | "students";
}

const EASTER_EGG_STUDENT_ID = "22-0224";

const EASTER_EGG_ROW: StudentRecord = {
  studentId: EASTER_EGG_STUDENT_ID,
  name: "Jerson De Real Caibog",
  college: "CICT",
  year: "2026",
  section: "A",
  profileImageUrl: "https://i.ibb.co/Y4ct3NRY/jersondereal.jpg",
};

export function AttendancePage({ tableType }: AttendancePageProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();

  const events = useEventsStore((s) => s.events);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);

  const students = useStudentsStore((s) => s.pagedStudents);
  const pagedStudents = useStudentsStore((s) => s.pagedStudents);
  const hasMore = useStudentsStore((s) => s.hasMore);
  const isFetchingPage = useStudentsStore((s) => s.isFetchingPage);
  const fetchStudentsPage = useStudentsStore((s) => s.fetchStudentsPage);
  const addStudentToStore = useStudentsStore((s) => s.addStudent);
  const updateStudentInStore = useStudentsStore((s) => s.updateStudent);
  const removeStudentsFromStore = useStudentsStore((s) => s.removeStudents);
  const totalStudentsCount = useStudentsStore((s) => s.total);

  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);
  // `total` from the store reflects the CURRENT search/filter's matching count,
  // not the grand total of all students — so it drops to 0 while searching for
  // the easter egg itself. Snapshot the true total whenever no search/filter is
  // active, and gate the row's visibility on that instead.
  const [baselineStudentTotal, setBaselineStudentTotal] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lastStatusChange, setLastStatusChange] = useState<{
    record: AttendanceRecord;
    profileImageUrl: string | null;
    updatedAt: number;
  } | null>(null);

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
  const attendanceHasMore = useAttendanceStore((s) => s.attendanceHasMore);
  const isFetchingAttendancePage = useAttendanceStore((s) => s.isFetchingAttendancePage);
  const fetchAttendancePage = useAttendanceStore((s) => s.fetchAttendancePage);
  const attendanceHistoryByEventId = useAttendanceStore((s) => s.attendanceHistoryByEventId);
  const fetchAttendanceHistory = useAttendanceStore((s) => s.fetchAttendanceHistory);
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

  useEffect(() => {
    if (events.length === 0) fetchEvents();
  }, [events.length, fetchEvents]);

  // Initial page load for students table
  useEffect(() => {
    if (tableType !== "students") return;
    fetchStudentsPage({ page: 1, search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section, sortKey: sortConfig.key, sortDir: sortConfig.direction }, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableType]);

  // Re-fetch page 1 when filters, debounced search, or sort change
  useEffect(() => {
    if (tableType !== "students") return;
    fetchStudentsPage({ page: 1, search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section, sortKey: sortConfig.key, sortDir: sortConfig.direction }, true);
  }, [tableType, debouncedSearch, selectedFilters.college, selectedFilters.year, selectedFilters.section, sortConfig.key, sortConfig.direction, fetchStudentsPage]);

  // Snapshot the true (unfiltered) student total whenever no search/filter is
  // active, since the store's `total` otherwise reflects the filtered count.
  useEffect(() => {
    if (
      tableType === "students" &&
      debouncedSearch === "" &&
      selectedFilters.college === "all" &&
      selectedFilters.year === "all" &&
      selectedFilters.section === "all"
    ) {
      setBaselineStudentTotal(totalStudentsCount);
    }
  }, [tableType, debouncedSearch, selectedFilters, totalStudentsCount]);

  const handleNearBottom = useCallback(() => {
    if (tableType !== "students" || !hasMore || isFetchingPage) return;
    const nextPage = Math.floor(pagedStudents.length / 50) + 1;
    fetchStudentsPage({ page: nextPage, search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section, sortKey: sortConfig.key, sortDir: sortConfig.direction });
  }, [tableType, hasMore, isFetchingPage, pagedStudents.length, debouncedSearch, selectedFilters, sortConfig, fetchStudentsPage]);

  const handleNearBottomAttendance = useCallback(() => {
    if (!selectedEvent || tableType !== "attendance") return;
    const eventId = selectedEvent.id;
    if (!attendanceHasMore[eventId] || isFetchingAttendancePage) return;
    const loaded = attendanceByEventId[eventId]?.length ?? 0;
    const nextPage = Math.floor(loaded / 50) + 1;
    fetchAttendancePage(eventId, { page: nextPage, search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section, sortKey: sortConfig.key, sortDir: sortConfig.direction });
  }, [selectedEvent, tableType, attendanceHasMore, isFetchingAttendancePage, attendanceByEventId, debouncedSearch, selectedFilters, sortConfig, fetchAttendancePage]);

  // Open profile card from URL param ?student=<id> (on students page only)
  useEffect(() => {
    if (tableType !== "students" || pagedStudents.length === 0) return;
    const params = new URLSearchParams(location.search);
    const studentId = params.get("student");
    if (!studentId) return;
    const match = pagedStudents.find((s) => s.studentId === studentId);
    if (match) setSelectedStudentForProfile(match);
  }, [tableType, pagedStudents, location.search, setSelectedStudentForProfile]);

  useEffect(() => {
    if (collegeOptions.length <= 1) fetchColleges();
  }, [collegeOptions.length, fetchColleges]);

  useEffect(() => {
    if (tableType !== "attendance") return;
    if (!eventIdParam || events.length === 0) return;
    const match = events.find((e) => e.id.toString() === eventIdParam);
    if (!match) {
      // Unknown/invalid event id — go back to the Events list.
      navigate("/events", { replace: true });
      return;
    }
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
  }, [tableType, eventIdParam, events, navigate, setSelectedEvent]);

  // Fetch page 1 when a new event is selected
  useEffect(() => {
    if (!selectedEvent || tableType !== "attendance") return;
    fetchAttendancePage(selectedEvent.id, { page: 1, search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section, sortKey: sortConfig.key, sortDir: sortConfig.direction }, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id, tableType]);

  // Fetch attendance history when a new event is selected
  useEffect(() => {
    if (!selectedEvent || tableType !== "attendance") return;
    fetchAttendanceHistory(selectedEvent.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id, tableType]);

  // Re-fetch page 1 when filters, search, or sort change (attendance)
  useEffect(() => {
    if (!selectedEvent || tableType !== "attendance") return;
    fetchAttendancePage(selectedEvent.id, { page: 1, search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section, sortKey: sortConfig.key, sortDir: sortConfig.direction }, true);
  }, [tableType, debouncedSearch, selectedFilters.college, selectedFilters.year, selectedFilters.section, sortConfig.key, sortConfig.direction, fetchAttendancePage]);

  const handleTableAction = (action: string, row: TableRecord) => {
    switch (action) {
      case "status":
        if ("status" in row && selectedEvent) {
          updateAttendanceRecord(
            selectedEvent.id,
            row.studentId,
            row as AttendanceRecord
          );
          setLastStatusChange({
            record: row as AttendanceRecord,
            profileImageUrl:
              students.find((s) => s.studentId === row.studentId)
                ?.profileImageUrl ?? null,
            updatedAt: Date.now(),
          });
          axios
            .put(
              `${config.API_BASE_URL}/attendance/${row.studentId}/${selectedEvent.id}`,
              { status: row.status }
            )
            .then(() => fetchAttendanceHistory(selectedEvent.id))
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

        setLastStatusChange({
          record: newAttendanceRecord,
          profileImageUrl: student?.profileImageUrl ?? null,
          updatedAt: Date.now(),
        });
        fetchAttendanceHistory(selectedEvent.id);
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
      setLastStatusChange,
      fetchAttendanceHistory,
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
      { value: "all", label: "All Years", shortLabel: "Year" },
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
    { value: "all", label: "All Sections", shortLabel: "Section" },
    { value: "a", label: "Section A" },
    { value: "b", label: "Section B" },
    { value: "c", label: "Section C" },
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
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
    // Students: filtering/sorting is handled server-side, return loaded pages as-is
    if (tableType === "students") return students;

    return attendanceData.filter((item) => {
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
  const sortedData = tableType === "students"
    ? filteredData
    : [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof TableRecord];
        const bValue = b[sortConfig.key as keyof TableRecord];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });

  const currentData = sortedData;

  // Frontend-only bragging-rights row, never persisted or sent to the backend.
  // Only shown once search/filters would plausibly match it, and inserted at
  // the position matching the current sort so it doesn't just sit at the end.
  let displayData: TableRecord[] = currentData;
  if (
    tableType === "students" &&
    config.ENABLE_EASTER_EGG &&
    baselineStudentTotal >= 100
  ) {
    const searchTerm = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      !searchTerm ||
      EASTER_EGG_ROW.studentId.toLowerCase().includes(searchTerm) ||
      EASTER_EGG_ROW.name.toLowerCase().includes(searchTerm) ||
      EASTER_EGG_ROW.college.toLowerCase().includes(searchTerm);
    const matchesCollege =
      selectedFilters.college === "all" ||
      EASTER_EGG_ROW.college.toLowerCase() === selectedFilters.college.toLowerCase();
    const matchesYear =
      selectedFilters.year === "all" || EASTER_EGG_ROW.year === selectedFilters.year;
    const matchesSection =
      selectedFilters.section === "all" ||
      EASTER_EGG_ROW.section.toLowerCase() === selectedFilters.section.toLowerCase();

    if (matchesSearch && matchesCollege && matchesYear && matchesSection) {
      const sortKey = sortConfig.key as keyof StudentRecord;
      // For these columns, always pin the row to the end instead of sorting it in.
      const alwaysLastKeys: (keyof StudentRecord)[] = ["studentId", "year", "section"];
      const eggValue = String(EASTER_EGG_ROW[sortKey] ?? "");
      const insertIndex = alwaysLastKeys.includes(sortKey)
        ? -1
        : currentData.findIndex((row) => {
            const rowValue = String((row as StudentRecord)[sortKey] ?? "");
            return sortConfig.direction === "asc"
              ? rowValue > eggValue
              : rowValue < eggValue;
          });
      displayData = [...currentData];
      displayData.splice(
        insertIndex === -1 ? displayData.length : insertIndex,
        0,
        EASTER_EGG_ROW
      );
    }
  }

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
      : selectedRows
          .map((index) => currentData[index])
          .filter((row): row is TableRecord => row != null);

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
        fetchAttendanceHistory(selectedEvent.id);
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

  const { total } = useStudentsStore.getState();
  const isAllSelected = tableType === "students"
    ? selectedRows.length > 0 && selectedRows.length === total
    : filteredData.length > 0 && selectedRows.length === filteredData.length;

  return (
    <div
      className={`w-full !h-full px-5 md:px-10 pt-10 lg:pb-10 ${
        tableType === "attendance" ? "pb-24" : "pb-10"
      }`}
    >
      <div className="flex items-start gap-6">
      <div className="min-w-0 flex-1">
      <div className="w-full max-w-[70rem] mx-auto mb-4">
        {tableType === "attendance" ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate("/events")}
              aria-label="Back to Events"
              className="rounded-[8px] p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {selectedEvent?.name ?? "Attendance"}
            </h1>
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-gray-900">Students</h1>
        )}
      </div>
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
            onToggleSelectAll={async () => {
              if (isAllSelected) {
                setSelectedRows([]);
              } else if (tableType === "students") {
                // Fetch all matching IDs from server respecting current filters
                try {
                  const res = await axios.get<{ ids: string[] }>(`${config.API_BASE_URL}/students/ids`, {
                    params: { search: debouncedSearch, college: selectedFilters.college, year: selectedFilters.year, section: selectedFilters.section },
                  });
                  // Map IDs to indices in the loaded pages; unloaded rows get virtual indices
                  const idToIndex = new Map(pagedStudents.map((s, i) => [s.studentId, i]));
                  const indices = res.data.ids.map((id, fallbackIdx) => idToIndex.get(id) ?? pagedStudents.length + fallbackIdx);
                  setSelectedRows(indices);
                } catch {
                  showToast("Failed to select all students", "error");
                }
              } else {
                const allIndices = filteredData.map((_, index) => index);
                setSelectedRows(allIndices);
              }
            }}
          />
        ) : (
          <AttendanceControls
            tableType={tableType}
            currentUserRole={currentUser?.role}
            onQRScanClick={() => setIsQrModalOpen(true)}
            onAddStudent={handleAddStudent}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            collegeOptions={scopedCollegeOptions}
            yearOptions={scopedYearOptions}
            sectionOptions={sectionOptions}
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
          onNearBottom={handleNearBottomAttendance}
        />
      ) : (
        <Table
          columns={studentColumns}
          data={displayData}
          onActionClick={handleTableAction}
          onRowClick={(row) => {
            if (!("studentId" in row) || "status" in row) return;
            const studentRow = row as StudentRecord;
            if (studentRow.studentId === EASTER_EGG_STUDENT_ID) {
              setIsEasterEggOpen(true);
              return;
            }
            setSelectedStudentForProfile(studentRow);
            navigate(`/students?student=${studentRow.studentId}`, { replace: true });
          }}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          currentUserRole={currentUser?.role}
          tableType="students"
          onNearBottom={handleNearBottom}
        />
      )}
      </div>

      {tableType === "attendance" && (
        <AttendanceUpdatePanel
          record={lastStatusChange?.record ?? null}
          profileImageUrl={lastStatusChange?.profileImageUrl ?? null}
          updatedAt={lastStatusChange?.updatedAt ?? null}
          history={selectedEvent ? attendanceHistoryByEventId[selectedEvent.id] ?? [] : []}
        />
      )}
      </div>

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

      <Modal
        modalClassName="!w-fit !max-w-fit !rounded-[20px]"
        isOpen={isEasterEggOpen}
        onClose={() => setIsEasterEggOpen(false)}
      >
        <EasterEggProfileCard
          name={EASTER_EGG_ROW.name}
          studentId={EASTER_EGG_ROW.studentId}
          college={EASTER_EGG_ROW.college}
          year={EASTER_EGG_ROW.year}
          section={EASTER_EGG_ROW.section}
          instagramHandle="@jersondereal"
          photoUrl="https://i.ibb.co/Y4ct3NRY/jersondereal.jpg"
          onClose={() => setIsEasterEggOpen(false)}
        />
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
