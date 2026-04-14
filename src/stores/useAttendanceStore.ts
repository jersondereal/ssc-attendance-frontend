import axios from "axios";
import { create } from "zustand";
import config from "../config";
import type { AttendanceRecord, DBAttendance, StudentRecord } from "./types";
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

export interface AttendanceFetchParams {
  page: number;
  limit?: number;
  search?: string;
  college?: string;
  year?: string;
  section?: string;
  status?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

interface AttendanceState {
  selectedEvent: Event | undefined;
  attendanceByEventId: Record<string, AttendanceRecord[]>;
  attendanceHasMore: Record<string, boolean>;
  attendanceTotal: Record<string, number>;
  isFetchingAttendancePage: boolean;
  fetchAttendancePage: (eventId: string, params: AttendanceFetchParams, reset?: boolean) => Promise<void>;
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

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  selectedEvent: undefined,
  attendanceByEventId: {},
  attendanceHasMore: {},
  attendanceTotal: {},
  isFetchingAttendancePage: false,

  fetchAttendancePage: async (eventId, params, reset = false) => {
    if (get().isFetchingAttendancePage) return;
    set({ isFetchingAttendancePage: true });
    try {
      const { page, limit = 50, search = "", college = "all", year = "all", section = "all", status = "all", sortKey = "name", sortDir = "asc" } = params;
      const res = await axios.get<{ data: DBAttendance[]; total: number }>(
        `${config.API_BASE_URL}/attendance/event/${eventId}/paginated`,
        { params: { page, limit, search, college, year, section, status, sortKey, sortDir } }
      );
      const mapped: AttendanceRecord[] = res.data.data.map((r) => ({
        studentId: r.student_id,
        name: r.name,
        college: (r.college ?? r.course ?? "").toUpperCase(),
        year: r.year,
        section: r.section.toUpperCase(),
        status: r.status,
      }));
      const existing = reset ? [] : (get().attendanceByEventId[eventId] ?? []);
      const merged = [...existing, ...mapped];
      set((state) => ({
        attendanceByEventId: { ...state.attendanceByEventId, [eventId]: merged },
        attendanceHasMore: { ...state.attendanceHasMore, [eventId]: merged.length < res.data.total },
        attendanceTotal: { ...state.attendanceTotal, [eventId]: res.data.total },
        isFetchingAttendancePage: false,
      }));
    } catch (err) {
      console.error(err);
      set({ isFetchingAttendancePage: false });
    }
  },

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
      attendanceByEventId: { ...state.attendanceByEventId, [eventId]: data },
      attendanceHasMore: { ...state.attendanceHasMore, [eventId]: false },
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
