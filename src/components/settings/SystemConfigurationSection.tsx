import { useEffect, useMemo, useRef, useState } from "react";
import {
  getBackup,
  getSystemSettings,
  restoreBackup,
  updateSystemSettings,
  type FeatureAccess,
} from "../../api/settings";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../common/Button/Button";
import Checkbox from "../common/Checkbox/Checkbox";
import Switch from "../common/Switch/Switch";
import { SettingCard } from "./SettingCard";

const defaultMaintenanceMode = false;
const defaultFeatureAccess: FeatureAccess = {
  viewer: {
    studentRegistration: true,
  },
  moderator: {
    studentRegistration: true,
    addEvent: true,
    editEvent: true,
    deleteEvent: true,
  },
};

export function SystemConfigurationSection() {
  const { showToast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(
    defaultMaintenanceMode
  );
  const [featureAccess, setFeatureAccess] = useState(defaultFeatureAccess);
  const [initialMaintenanceMode, setInitialMaintenanceMode] = useState(
    defaultMaintenanceMode
  );
  const [initialFeatureAccess, setInitialFeatureAccess] =
    useState<FeatureAccess>(defaultFeatureAccess);
  const [isLoading, setIsLoading] = useState(true);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getSystemSettings()
      .then((settings) => {
        setMaintenanceMode(settings.maintenanceMode);
        setFeatureAccess(settings.featureAccess);
        setInitialMaintenanceMode(settings.maintenanceMode);
        setInitialFeatureAccess(settings.featureAccess);
      })
      .catch(() => showToast("Failed to load system settings", "error"))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const hasMaintenanceModeChanges = useMemo(
    () => !isLoading && maintenanceMode !== initialMaintenanceMode,
    [maintenanceMode, initialMaintenanceMode, isLoading]
  );

  const hasFeatureAccessChanges = useMemo(
    () =>
      !isLoading &&
      (featureAccess.viewer.studentRegistration !==
        initialFeatureAccess.viewer.studentRegistration ||
        featureAccess.moderator.studentRegistration !==
          initialFeatureAccess.moderator.studentRegistration ||
        featureAccess.moderator.addEvent !==
          initialFeatureAccess.moderator.addEvent ||
        featureAccess.moderator.editEvent !==
          initialFeatureAccess.moderator.editEvent ||
        featureAccess.moderator.deleteEvent !==
          initialFeatureAccess.moderator.deleteEvent),
    [featureAccess, initialFeatureAccess, isLoading]
  );

  const saveButtonClass =
    "!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2";

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        System Configuration
      </h1>
      <div className="space-y-6">
        <SettingCard
          title="Feature Access"
          description="Configure the access permissions for each user role. These permissions determine what actions each role can perform within the system."
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Viewer Access
              </h3>
              <div className="space-y-2">
                <Checkbox
                  id="viewer-register"
                  checked={featureAccess.viewer.studentRegistration}
                  onChange={(checked) =>
                    setFeatureAccess((prev) => ({
                      ...prev,
                      viewer: {
                        ...prev.viewer,
                        studentRegistration: checked,
                      },
                    }))
                  }
                  label="Student Registration"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Moderator Access
              </h3>
              <div className="space-y-2">
                <Checkbox
                  id="moderator-register"
                  checked={featureAccess.moderator.studentRegistration}
                  onChange={(checked) =>
                    setFeatureAccess((prev) => ({
                      ...prev,
                      moderator: {
                        ...prev.moderator,
                        studentRegistration: checked,
                      },
                    }))
                  }
                  label="Student Registration"
                />
                <Checkbox
                  id="moderator-add-event"
                  checked={featureAccess.moderator.addEvent}
                  onChange={(checked) =>
                    setFeatureAccess((prev) => ({
                      ...prev,
                      moderator: {
                        ...prev.moderator,
                        addEvent: checked,
                      },
                    }))
                  }
                  label="Add Event"
                />
                <Checkbox
                  id="moderator-edit-event"
                  checked={featureAccess.moderator.editEvent}
                  onChange={(checked) =>
                    setFeatureAccess((prev) => ({
                      ...prev,
                      moderator: {
                        ...prev.moderator,
                        editEvent: checked,
                      },
                    }))
                  }
                  label="Edit Event"
                />
                <Checkbox
                  id="moderator-delete-event"
                  checked={featureAccess.moderator.deleteEvent}
                  onChange={(checked) =>
                    setFeatureAccess((prev) => ({
                      ...prev,
                      moderator: {
                        ...prev.moderator,
                        deleteEvent: checked,
                      },
                    }))
                  }
                  label="Delete Event"
                />
              </div>
            </div>
          </div>
          {hasFeatureAccessChanges && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  updateSystemSettings({ featureAccess })
                    .then(() => {
                      showToast("Feature access saved", "success");
                      setInitialFeatureAccess(featureAccess);
                    })
                    .catch(() =>
                      showToast("Failed to save feature access", "error")
                    );
                }}
                label="Save"
                className={saveButtonClass}
              />
            </div>
          )}
        </SettingCard>

        <SettingCard
          title="Backup & Restore"
          disabled
          description="Create backups of your system data to prevent data loss. You can restore from a previous backup if needed. Regular backups are recommended before major system changes."
        >
          <div className="flex gap-2">
            <Button
              label="Create Backup"
              className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2"
              onClick={() => {
                getBackup()
                  .then((data) => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                      type: "application/json",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `ssc-backup-${
                      new Date().toISOString().split("T")[0]
                    }.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  })
                  .catch(() => showToast("Failed to create backup", "error"));
              }}
            />
            <Button
              label="Restore Backup"
              variant="secondary"
              className="!px-4 !py-2"
              onClick={() => restoreInputRef.current?.click()}
            />
            <input
              ref={restoreInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const parsed = JSON.parse(
                      reader.result?.toString() ?? "{}"
                    );
                    const confirmed = window.confirm(
                      "This will overwrite existing data. Continue?"
                    );
                    if (!confirmed) return;
                    restoreBackup(parsed)
                      .then(() => {
                        showToast("Backup restored", "success");
                      })
                      .catch(() =>
                        showToast("Failed to restore backup", "error")
                      );
                  } catch {
                    showToast("Invalid backup file", "error");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </div>
        </SettingCard>

        <SettingCard
          title="Maintenance Mode"
          description="Enable maintenance mode to temporarily restrict access to the system. When enabled, only administrators can access the application. This is useful during system updates or maintenance periods."
        >
          <div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onChange={(checked) => setMaintenanceMode(checked)}
              label="Enable Maintenance Mode"
            />
          </div>
          {hasMaintenanceModeChanges && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  updateSystemSettings({ maintenanceMode })
                    .then(() => {
                      showToast("Maintenance mode saved", "success");
                      setInitialMaintenanceMode(maintenanceMode);
                    })
                    .catch(() =>
                      showToast("Failed to save maintenance mode", "error")
                    );
                }}
                label="Save"
                className={saveButtonClass}
              />
            </div>
          )}
        </SettingCard>
      </div>
    </div>
  );
}
