import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

interface SettingsContextValue {
  systemSettings: SystemSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  systemSettings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [systemSettings, setSystemSettings] =
    useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await getSystemSettings();
      setSystemSettings(settings);
    } catch {
      // Keep defaults when the API fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const value = useMemo(
    () => ({ systemSettings, isLoading, refreshSettings }),
    [systemSettings, isLoading, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
