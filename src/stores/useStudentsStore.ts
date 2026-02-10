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

interface StudentsState {
  students: StudentRecord[];
  loading: boolean;
  fetchStudents: () => Promise<void>;
  setStudents: (students: StudentRecord[]) => void;
  addStudent: (student: DBStudent) => void;
  updateStudent: (studentId: string, student: DBStudent) => void;
  removeStudents: (studentIds: string[]) => void;
}

export const useStudentsStore = create<StudentsState>((set) => ({
  students: [],
  loading: false,

  fetchStudents: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<DBStudent[]>(`${config.API_BASE_URL}/students`);
      const mapped = (res.data ?? []).map(mapDbStudent);
      set({ students: mapped, loading: false });
    } catch (err) {
      console.error(err);
      set({ students: [], loading: false });
    }
  },

  setStudents: (students) => set({ students }),

  addStudent: (student) =>
    set((state) => ({
      students: [...state.students, mapDbStudent(student)],
    })),

  updateStudent: (studentId, student) =>
    set((state) => ({
      students: state.students.map((s) =>
        s.studentId === studentId ? mapDbStudent(student) : s
      ),
    })),

  removeStudents: (studentIds) =>
    set((state) => ({
      students: state.students.filter((s) => !studentIds.includes(s.studentId)),
    })),
}));
