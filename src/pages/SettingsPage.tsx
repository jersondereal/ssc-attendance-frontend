import { useMemo, useState } from "react";
import { Button } from "../components/common/Button/Button";
import Checkbox from "../components/common/Checkbox/Checkbox";
import Switch from "../components/common/Switch/Switch";
import { Textbox } from "../components/common/Textbox/Textbox";

interface SettingsPageProps {
  currentUser: {
    username: string;
    role: string;
  } | null;
}

// Initial values for comparison (moved outside component to avoid recreation on each render)
const initialGeneralSettings = {
  appName: "SSC Attendance Online",
  councilName: "Student Supreme Council",
};

const initialMaintenanceMode = false;

const initialFeatureAccess = {
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

export function SettingsPage({ currentUser }: SettingsPageProps) {
  // General Settings state
  const [generalSettings, setGeneralSettings] = useState(
    initialGeneralSettings
  );

  // System Configuration state
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialMaintenanceMode
  );

  // Feature Access state
  const [featureAccess, setFeatureAccess] = useState(initialFeatureAccess);

  // Check if individual settings have changed from initial
  const hasAppNameChanges = useMemo(() => {
    return generalSettings.appName !== initialGeneralSettings.appName;
  }, [generalSettings.appName]);

  const hasCouncilNameChanges = useMemo(() => {
    return generalSettings.councilName !== initialGeneralSettings.councilName;
  }, [generalSettings.councilName]);

  const hasMaintenanceModeChanges = useMemo(() => {
    return maintenanceMode !== initialMaintenanceMode;
  }, [maintenanceMode]);

  const hasFeatureAccessChanges = useMemo(() => {
    return (
      featureAccess.viewer.studentRegistration !==
        initialFeatureAccess.viewer.studentRegistration ||
      featureAccess.moderator.studentRegistration !==
        initialFeatureAccess.moderator.studentRegistration ||
      featureAccess.moderator.addEvent !==
        initialFeatureAccess.moderator.addEvent ||
      featureAccess.moderator.editEvent !==
        initialFeatureAccess.moderator.editEvent ||
      featureAccess.moderator.deleteEvent !==
        initialFeatureAccess.moderator.deleteEvent
    );
  }, [featureAccess]);
  if (currentUser?.role?.toLowerCase() === "viewer") {
    return (
      <div className="w-full max-w-[60rem] mx-auto flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Settings Unavailable
          </h2>
          <p className="text-gray-500 text-sm">
            Settings are not available for your account. If you need access to
            settings, please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 pb-24">
        <div className="space-y-8">
          {/* General Settings Section */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-6">
              General Settings
            </h1>
            <div className="space-y-6">
              {/* App Name Section */}
              <div className="bg-white border border-border-dark rounded-md p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  App Name
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Set the display name for the application. This name will
                  appear in the header and throughout the system interface.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    App Name
                  </label>
                  <Textbox
                    value={generalSettings.appName}
                    onChange={(e) => {
                      setGeneralSettings({
                        ...generalSettings,
                        appName: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2"
                    placeholder="Enter app name"
                  />
                </div>
                {hasAppNameChanges && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        // TODO: Save app name
                      }}
                      label="Save"
                      className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2"
                    />
                  </div>
                )}
              </div>

              {/* Council Name Section */}
              <div className="bg-white border border-border-dark rounded-md p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Council Name
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Configure the name of your student council or organization.
                  This will be used in reports, documents, and system
                  communications.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Council Name
                  </label>
                  <Textbox
                    value={generalSettings.councilName}
                    onChange={(e) => {
                      setGeneralSettings({
                        ...generalSettings,
                        councilName: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2"
                    placeholder="Enter council name"
                  />
                </div>
                {hasCouncilNameChanges && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        // TODO: Save council name
                      }}
                      label="Save"
                      className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2"
                    />
                  </div>
                )}
              </div>

              {/* Logo Upload Section */}
              <div className="bg-white border border-border-dark rounded-md p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Logo Upload
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Upload your organization's logo to customize the application's
                  appearance. The logo will be displayed in the header and on
                  exported documents.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Logo Upload
                  </label>
                  <div className="border border-border-dark rounded-md p-4 text-center">
                    <p className="text-xs text-gray-500">
                      Logo upload feature will be available here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Configuration Section */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-6">
              System Configuration
            </h1>
            <div className="space-y-6">

              {/* Feature Toggles Section */}
              <div className="bg-white border border-border-dark rounded-md p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Feature Access
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Configure the access permissions for each user role. These
                  permissions determine what actions each role can perform
                  within the system.
                </p>
                <div className="space-y-4">
                  {/* Viewer Access */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Viewer Access
                    </h3>
                    <div className="space-y-2">
                      <Checkbox
                        id="viewer-student-registration"
                        checked={featureAccess.viewer.studentRegistration}
                        onChange={(checked) => {
                          setFeatureAccess({
                            ...featureAccess,
                            viewer: {
                              ...featureAccess.viewer,
                              studentRegistration: checked,
                            },
                          });
                        }}
                        label="Student Registration"
                      />
                    </div>
                  </div>

                  {/* Moderator Access */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Moderator Access
                    </h3>
                    <div className="space-y-2">
                      <Checkbox
                        id="moderator-student-registration"
                        checked={featureAccess.moderator.studentRegistration}
                        onChange={(checked) => {
                          setFeatureAccess({
                            ...featureAccess,
                            moderator: {
                              ...featureAccess.moderator,
                              studentRegistration: checked,
                            },
                          });
                        }}
                        label="Student Registration"
                      />
                      <Checkbox
                        id="moderator-add-event"
                        checked={featureAccess.moderator.addEvent}
                        onChange={(checked) => {
                          setFeatureAccess({
                            ...featureAccess,
                            moderator: {
                              ...featureAccess.moderator,
                              addEvent: checked,
                            },
                          });
                        }}
                        label="Add Event"
                      />
                      <Checkbox
                        id="moderator-edit-event"
                        checked={featureAccess.moderator.editEvent}
                        onChange={(checked) => {
                          setFeatureAccess({
                            ...featureAccess,
                            moderator: {
                              ...featureAccess.moderator,
                              editEvent: checked,
                            },
                          });
                        }}
                        label="Edit Event"
                      />
                      <Checkbox
                        id="moderator-delete-event"
                        checked={featureAccess.moderator.deleteEvent}
                        onChange={(checked) => {
                          setFeatureAccess({
                            ...featureAccess,
                            moderator: {
                              ...featureAccess.moderator,
                              deleteEvent: checked,
                            },
                          });
                        }}
                        label="Delete Event"
                      />
                    </div>
                  </div>
                </div>
                {hasFeatureAccessChanges && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        // TODO: Save feature access
                      }}
                      label="Save"
                      className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2"
                    />
                  </div>
                )}
              </div>

              {/* Backup & Restore Section */}
              <div className="bg-white border border-border-dark rounded-md p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Backup & Restore
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Create backups of your system data to prevent data loss. You
                  can restore from a previous backup if needed. Regular backups
                  are recommended before major system changes.
                </p>
                <div>
                  <div className="flex gap-2">
                    <Button
                      label="Create Backup"
                      className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2 cursor-not-allowed"
                    />
                    <Button
                      label="Restore Backup"
                      variant="secondary"
                      className="!px-4 !py-2 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Mode Section */}
              <div className="bg-white border border-border-dark rounded-md p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Maintenance Mode
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Enable maintenance mode to temporarily restrict access to the
                  system. When enabled, only administrators can access the
                  application. This is useful during system updates or
                  maintenance periods.
                </p>
                <div>
                  <Switch
                    id="maintenance-mode"
                    checked={maintenanceMode}
                    onChange={(checked) => {
                      setMaintenanceMode(checked);
                    }}
                    label="Enable Maintenance Mode"
                  />
                </div>
                {hasMaintenanceModeChanges && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        // TODO: Save maintenance mode
                      }}
                      label="Save"
                      className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
