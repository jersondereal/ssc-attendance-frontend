import {
  GeneralSettingsSection,
  SettingsUnavailable,
  SystemConfigurationSection,
} from "../components/settings";

interface SettingsPageProps {
  currentUser: {
    username: string;
    role: string;
  } | null;
}

export function SettingsPage({ currentUser }: SettingsPageProps) {
  if (currentUser?.role?.toLowerCase() === "viewer") {
    return <SettingsUnavailable />;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 pb-24">
        <div className="space-y-8">
          <GeneralSettingsSection />
          <SystemConfigurationSection />
        </div>
      </div>
    </div>
  );
}
