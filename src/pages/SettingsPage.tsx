import {
  GeneralSettingsSection,
  SettingsUnavailable,
  SystemConfigurationSection,
} from "../components/settings";
import { useAuthStore } from "../stores/useAuthStore";

export function SettingsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  if (currentUser?.role?.toLowerCase() === "viewer") {
    return <SettingsUnavailable />;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 pb-10">
        <div className="space-y-8">
          <GeneralSettingsSection />
          <SystemConfigurationSection />
        </div>
      </div>
    </div>
  );
}
