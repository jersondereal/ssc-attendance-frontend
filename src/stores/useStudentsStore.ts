import axios from "axios";
import { create } from "zustand";
import config from "../config";
import type { DBStudent, StudentRecord } from "./types";

function mapDbStudent(student: DBStudent): StudentRecord {
  return {
    studentId: student.student_id,
    name: student.name,
    college: (student.college ?? student.course ?? "").toUpperCase(),
    year: student.year,
    section: student.section.toUpperCase(),
    rfid: student.rfid,
    profileImageUrl: student.profile_image_url ?? null,
  };
}

export interface StudentFetchParams {
  page: number;
  limit?: number;
  search?: string;
  college?: string;
  year?: string;
  section?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

interface StudentsState {
  // Paginated state (used by the students table)
  pagedStudents: StudentRecord[];
  page: number;
  hasMore: boolean;
  total: number;
  isFetchingPage: boolean;
  fetchStudentsPage: (params: StudentFetchParams, reset?: boolean) => Promise<void>;

  // Full list (used only for QR scan lookup fallback)
  students: StudentRecord[];
  fetchStudents: () => Promise<void>;

  // Mutations
  addStudent: (student: DBStudent) => void;
  updateStudent: (studentId: string, student: DBStudent) => void;
  removeStudents: (studentIds: string[]) => void;
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  pagedStudents: [],
  page: 0,
  hasMore: true,
  total: 0,
  isFetchingPage: false,

  fetchStudentsPage: async (params, reset = false) => {
    if (get().isFetchingPage) return;
    set({ isFetchingPage: true });
    try {
      const { page, limit = 50, search = "", college = "all", year = "all", section = "all", sortKey = "student_id", sortDir = "asc" } = params;
      const res = await axios.get<{ data: DBStudent[]; total: number; page: number; limit: number }>(
        `${config.API_BASE_URL}/students/paginated`,
        { params: { page, limit, search, college, year, section, sortKey, sortDir } }
      );
      const mapped = res.data.data.map(mapDbStudent);
      const total = res.data.total;
      const loaded = reset ? mapped : [...get().pagedStudents, ...mapped];
      set({
        pagedStudents: loaded,
        page,
        total,
        hasMore: loaded.length < total,
        isFetchingPage: false,
      });
    } catch (err) {
      console.error(err);
      set({ isFetchingPage: false });
    }
  },

  students: [],
  loading: false,

  fetchStudents: async () => {
    try {
      const res = await axios.get<DBStudent[]>(`${config.API_BASE_URL}/students`);
      set({ students: (res.data ?? []).map(mapDbStudent) });
    } catch (err) {
      console.error(err);
    }
  },

  addStudent: (student) =>
    set((state) => ({
      pagedStudents: [mapDbStudent(student), ...state.pagedStudents],
      total: state.total + 1,
    })),

  updateStudent: (studentId, student) =>
    set((state) => ({
      pagedStudents: state.pagedStudents.map((s) =>
        s.studentId === studentId ? mapDbStudent(student) : s
      ),
    })),

  removeStudents: (studentIds) =>
    set((state) => ({
      pagedStudents: state.pagedStudents.filter((s) => !studentIds.includes(s.studentId)),
      total: state.total - studentIds.length,
    })),
}));
