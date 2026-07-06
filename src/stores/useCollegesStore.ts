import { create } from "zustand";
import { getColleges, collegesToOptions, type College } from "../api/colleges";

export interface CollegeOption {
  value: string;
  label: string;
  shortLabel?: string;
}

interface CollegesState {
  colleges: College[];
  collegeOptions: CollegeOption[];
  loading: boolean;
  fetchColleges: () => Promise<void>;
}

export const useCollegesStore = create<CollegesState>((set) => ({
  colleges: [],
  collegeOptions: [{ value: "all", label: "All Colleges", shortLabel: "College" }],
  loading: false,

  fetchColleges: async () => {
    set({ loading: true });
    try {
      const list = await getColleges();
      set({
        colleges: list,
        collegeOptions: [
          { value: "all", label: "All Colleges", shortLabel: "College" },
          ...collegesToOptions(list),
        ],
        loading: false,
      });
    } catch {
      set({
        colleges: [],
        collegeOptions: [{ value: "all", label: "All Colleges", shortLabel: "College" }],
        loading: false,
      });
    }
  },
}));
