import { useSettingsStore } from "../stores/useSettingsStore";

/**
 * Thin re-export for backwards compatibility.
 * Prefer useSettingsStore() for new code.
 */
export function useSettings() {
  const systemSettings = useSettingsStore((s) => s.systemSettings);
  const isLoading = useSettingsStore((s) => s.isLoading);
  const refreshSettings = useSettingsStore((s) => s.refreshSettings);
  return { systemSettings, isLoading, refreshSettings };
}
