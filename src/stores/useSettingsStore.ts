import { create } from "zustand";
import { getSystemSettings, type SystemSettings } from "../api/settings";

const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  featureAccess: {
    viewer: { studentRegistration: true },
    moderator: {
      studentRegistration: true,
      addEvent: true,
      editEvent: true,
      deleteEvent: true,
    },
  },
};

interface SettingsState {
  systemSettings: SystemSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  systemSettings: defaultSettings,
  isLoading: true,

  refreshSettings: async () => {
    try {
      const settings = await getSystemSettings();
      set({ systemSettings: settings });
    } catch {
      // Keep defaults when the API fails
    } finally {
      set({ isLoading: false });
    }
  },
}));
