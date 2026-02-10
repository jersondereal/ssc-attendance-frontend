import axios from "axios";
import { create } from "zustand";
import config from "../config";
import type { Event } from "../components/common/EventSelector/types";

export type RangeValue =
  | "last_24_hours"
  | "last_7_days"
  | "last_30_days"
  | "last_3_months"
  | "last_12_months"
  | "last_24_months";

interface OverviewState {
  totalStudents: number | null;
  averageAttendanceRate: number | null;
  totalFinesOutstanding: number | null;
  totalFinesCollected: number | null;
  range: RangeValue;
  visibleEventCount: number;
  eventToEdit: Event | null;
  eventToDelete: Event | null;
  deleteEventConfirmChecked: boolean;
  menuOpenFor: string | null;
  isAddEventModalOpen: boolean;

  fetchOverviewMetrics: (range?: RangeValue) => Promise<void>;
  setRange: (range: RangeValue) => void;
  setVisibleEventCount: (n: number | ((prev: number) => number)) => void;
  setEventToEdit: (e: Event | null) => void;
  setEventToDelete: (e: Event | null) => void;
  setDeleteEventConfirmChecked: (v: boolean) => void;
  setMenuOpenFor: (id: string | null) => void;
  setIsAddEventModalOpen: (v: boolean) => void;
}

export const useOverviewStore = create<OverviewState>((set, get) => ({
  totalStudents: null,
  averageAttendanceRate: null,
  totalFinesOutstanding: null,
  totalFinesCollected: null,
  range: "last_30_days",
  visibleEventCount: 6,
  eventToEdit: null,
  eventToDelete: null,
  deleteEventConfirmChecked: false,
  menuOpenFor: null,
  isAddEventModalOpen: false,

  fetchOverviewMetrics: async (range) => {
    const r = range ?? get().range;
    try {
      const [studentsRes, attendanceRes, finesRes] = await Promise.all([
        axios.get<{ totalStudents: number }>(
          `${config.API_BASE_URL}/overview/students`
        ),
        axios.get<{ averageAttendanceRate: number }>(
          `${config.API_BASE_URL}/overview/attendance`,
          { params: { range: r } }
        ),
        axios.get<{
          totalFinesOutstanding: number;
          totalFinesCollected: number;
        }>(`${config.API_BASE_URL}/overview/fines`, { params: { range: r } }),
      ]);
      set({
        totalStudents: studentsRes.data?.totalStudents ?? null,
        averageAttendanceRate: attendanceRes.data?.averageAttendanceRate ?? null,
        totalFinesOutstanding: finesRes.data?.totalFinesOutstanding ?? null,
        totalFinesCollected: finesRes.data?.totalFinesCollected ?? null,
      });
    } catch {
      set({
        totalStudents: null,
        averageAttendanceRate: null,
        totalFinesOutstanding: null,
        totalFinesCollected: null,
      });
    }
  },

  setRange: (range) => set({ range }),

  setVisibleEventCount: (n) =>
    set((state) => ({
      visibleEventCount: typeof n === "function" ? n(state.visibleEventCount) : n,
    })),

  setEventToEdit: (e) => set({ eventToEdit: e }),
  setEventToDelete: (e) => set({ eventToDelete: e }),
  setDeleteEventConfirmChecked: (v) => set({ deleteEventConfirmChecked: v }),
  setMenuOpenFor: (id) => set({ menuOpenFor: id }),
  setIsAddEventModalOpen: (v) => set({ isAddEventModalOpen: v }),
}));
