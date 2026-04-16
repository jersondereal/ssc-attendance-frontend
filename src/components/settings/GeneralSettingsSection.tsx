import { useEffect, useMemo, useState } from "react";
import { getGeneralSettings, updateGeneralSettings } from "../../api/settings";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../common/Button/Button";
import { Textbox } from "../common/Textbox/Textbox";
import { CollegesSection } from "./CollegesSection";
import { SettingCard } from "./SettingCard";

const initialGeneralSettings = {
  appName: "SSC Attendance Online",
  councilName: "Student Supreme Council",
  logoData: "",
};

export function GeneralSettingsSection() {
  const { showToast } = useToast();
  const [generalSettings, setGeneralSettings] = useState(
    initialGeneralSettings
  );
  const [initialSettings, setInitialSettings] = useState(
    initialGeneralSettings
  );
  const [isLoading, setIsLoading] = useState(true);
  const [logoFileName, setLogoFileName] = useState("");

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => {
        setGeneralSettings(settings);
        setInitialSettings(settings);
      })
      .catch(() => showToast("Failed to load general settings", "error"))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const hasAppNameChanges = useMemo(
    () => !isLoading && generalSettings.appName !== initialSettings.appName,
    [generalSettings.appName, initialSettings.appName, isLoading]
  );
  const hasCouncilNameChanges = useMemo(
    () =>
      !isLoading && generalSettings.councilName !== initialSettings.councilName,
    [generalSettings.councilName, initialSettings.councilName, isLoading]
  );
  const hasLogoChanges = useMemo(
    () => !isLoading && generalSettings.logoData !== initialSettings.logoData,
    [generalSettings.logoData, initialSettings.logoData, isLoading]
  );

  const saveButtonClass =
    "!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2";

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        General Settings
      </h1>
      <div className="space-y-6">
        <div className="hidden">
        <SettingCard
          title="App Name"
          disabled
          description="Set the display name for the application. This name will appear in the header and throughout the system interface."
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Name
            </label>
            <Textbox
              value={generalSettings.appName}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  appName: e.target.value,
                }))
              }
              className="w-full px-3 py-2"
              placeholder="Enter app name"
            />
          </div>
          {hasAppNameChanges && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  updateGeneralSettings({ appName: generalSettings.appName })
                    .then(() => {
                      showToast("App name saved", "success");
                      setInitialSettings((prev) => ({
                        ...prev,
                        appName: generalSettings.appName,
                      }));
                    })
                    .catch(() => showToast("Failed to save app name", "error"));
                }}
                label="Save"
                className={saveButtonClass}
              />
            </div>
          )}
        </SettingCard>

        <SettingCard
          title="Council Name"
          disabled
          description="Configure the name of your student council or organization. This will be used in reports, documents, and system communications."
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Council Name
            </label>
            <Textbox
              value={generalSettings.councilName}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  councilName: e.target.value,
                }))
              }
              className="w-full px-3 py-2"
              placeholder="Enter council name"
            />
          </div>
          {hasCouncilNameChanges && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  updateGeneralSettings({
                    councilName: generalSettings.councilName,
                  })
                    .then(() => {
                      showToast("Council name saved", "success");
                      setInitialSettings((prev) => ({
                        ...prev,
                        councilName: generalSettings.councilName,
                      }));
                    })
                    .catch(() =>
                      showToast("Failed to save council name", "error")
                    );
                }}
                label="Save"
                className={saveButtonClass}
              />
            </div>
          )}
        </SettingCard>

        <SettingCard
          title="Logo Upload"
          disabled
          description="Upload your organization's logo to customize the application's appearance. The logo will be displayed in the header and on exported documents."
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo Upload
            </label>
            {generalSettings.logoData ? (
              <div className="border border-border-dark rounded-[8px] p-4 text-center">
                <img
                  src={generalSettings.logoData}
                  alt="Organization logo"
                  className="max-h-28 mx-auto"
                />
              </div>
            ) : (
              <div className="border border-border-dark rounded-[8px] p-4 text-center">
                <p className="text-sm text-gray-500">No logo uploaded yet.</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setLogoFileName(file.name);
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result?.toString() ?? "";
                  setGeneralSettings((prev) => ({
                    ...prev,
                    logoData: result,
                  }));
                };
                reader.readAsDataURL(file);
              }}
            />
            {logoFileName && (
              <p className="text-xs text-gray-500">Selected: {logoFileName}</p>
            )}
          </div>
          {hasLogoChanges && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  updateGeneralSettings({ logoData: generalSettings.logoData })
                    .then(() => {
                      showToast("Logo saved", "success");
                      setInitialSettings((prev) => ({
                        ...prev,
                        logoData: generalSettings.logoData,
                      }));
                    })
                    .catch(() => showToast("Failed to save logo", "error"));
                }}
                label="Save"
                className={saveButtonClass}
              />
            </div>
          )}
        </SettingCard>
        </div>

        <CollegesSection />
      </div>
    </div>
  );
}
