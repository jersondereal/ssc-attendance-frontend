import { create } from "zustand";
import type { AttendanceRecord, StudentRecord } from "./types";
import type { Event } from "../components/common/EventSelector/types";

interface SelectedFilters {
  college: string;
  year: string;
  section: string;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface AttendanceState {
  selectedEvent: Event | undefined;
  attendanceByEventId: Record<string, AttendanceRecord[]>;
  selectedFilters: SelectedFilters;
  searchQuery: string;
  sortConfig: SortConfig;
  selectedRows: number[];
  selectedStudentForProfile: StudentRecord | null;
  editingStudent: AttendanceRecord | StudentRecord | null;
  isQrModalOpen: boolean;
  isAddStudentModalOpen: boolean;
  isEditStudentModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  deleteConfirmChecked: boolean;
  isBulkAttendanceModalOpen: boolean;
  bulkAttendanceStatus: string;
  bulkAttendanceConfirmChecked: boolean;

  setSelectedEvent: (event: Event | undefined) => void;
  setAttendanceForEvent: (eventId: string, data: AttendanceRecord[]) => void;
  updateAttendanceRecord: (
    eventId: string,
    studentId: string,
    record: AttendanceRecord
  ) => void;
  setSelectedFilters: (filters: SelectedFilters | ((prev: SelectedFilters) => SelectedFilters)) => void;
  setSearchQuery: (q: string) => void;
  setSortConfig: (c: SortConfig) => void;
  setSelectedRows: (rows: number[] | ((prev: number[]) => number[])) => void;
  setSelectedStudentForProfile: (s: StudentRecord | null) => void;
  setEditingStudent: (s: AttendanceRecord | StudentRecord | null) => void;
  setIsQrModalOpen: (v: boolean) => void;
  setIsAddStudentModalOpen: (v: boolean) => void;
  setIsEditStudentModalOpen: (v: boolean) => void;
  setIsDeleteConfirmModalOpen: (v: boolean) => void;
  setDeleteConfirmChecked: (v: boolean) => void;
  setIsBulkAttendanceModalOpen: (v: boolean) => void;
  setBulkAttendanceStatus: (v: string) => void;
  setBulkAttendanceConfirmChecked: (v: boolean) => void;
}

const defaultFilters: SelectedFilters = {
  college: "all",
  year: "all",
  section: "all",
};

const defaultSort: SortConfig = { key: "name", direction: "asc" };

export const useAttendanceStore = create<AttendanceState>((set) => ({
  selectedEvent: undefined,
  attendanceByEventId: {},
  selectedFilters: defaultFilters,
  searchQuery: "",
  sortConfig: defaultSort,
  selectedRows: [],
  selectedStudentForProfile: null,
  editingStudent: null,
  isQrModalOpen: false,
  isAddStudentModalOpen: false,
  isEditStudentModalOpen: false,
  isDeleteConfirmModalOpen: false,
  deleteConfirmChecked: false,
  isBulkAttendanceModalOpen: false,
  bulkAttendanceStatus: "",
  bulkAttendanceConfirmChecked: false,

  setSelectedEvent: (event) => set({ selectedEvent: event }),

  setAttendanceForEvent: (eventId, data) =>
    set((state) => ({
      attendanceByEventId: {
        ...state.attendanceByEventId,
        [eventId]: data,
      },
    })),

  updateAttendanceRecord: (eventId, studentId, record) =>
    set((state) => {
      const list = state.attendanceByEventId[eventId] ?? [];
      return {
        attendanceByEventId: {
          ...state.attendanceByEventId,
          [eventId]: list.map((r) =>
            r.studentId === studentId ? record : r
          ),
        },
      };
    }),

  setSelectedFilters: (filters) =>
    set((state) => ({
      selectedFilters:
        typeof filters === "function"
          ? filters(state.selectedFilters)
          : filters,
    })),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortConfig: (c) => set({ sortConfig: c }),

  setSelectedRows: (rows) =>
    set((state) => ({
      selectedRows:
        typeof rows === "function" ? rows(state.selectedRows) : rows,
    })),

  setSelectedStudentForProfile: (s) => set({ selectedStudentForProfile: s }),
  setEditingStudent: (s) => set({ editingStudent: s }),

  setIsQrModalOpen: (v) => set({ isQrModalOpen: v }),
  setIsAddStudentModalOpen: (v) => set({ isAddStudentModalOpen: v }),
  setIsEditStudentModalOpen: (v) => set({ isEditStudentModalOpen: v }),
  setIsDeleteConfirmModalOpen: (v) => set({ isDeleteConfirmModalOpen: v }),
  setDeleteConfirmChecked: (v) => set({ deleteConfirmChecked: v }),
  setIsBulkAttendanceModalOpen: (v) => set({ isBulkAttendanceModalOpen: v }),
  setBulkAttendanceStatus: (v) => set({ bulkAttendanceStatus: v }),
  setBulkAttendanceConfirmChecked: (v) =>
    set({ bulkAttendanceConfirmChecked: v }),
}));
