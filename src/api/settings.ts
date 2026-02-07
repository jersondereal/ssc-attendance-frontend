import axios from "axios";
import config from "../config";

export interface FeatureAccess {
  viewer: {
    studentRegistration: boolean;
  };
  moderator: {
    studentRegistration: boolean;
    addEvent: boolean;
    editEvent: boolean;
    deleteEvent: boolean;
  };
}

export interface SystemSettings {
  maintenanceMode: boolean;
  featureAccess: FeatureAccess;
}

export interface GeneralSettings {
  appName: string;
  councilName: string;
  logoData: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await axios.get<SystemSettings>(
    `${config.API_BASE_URL}/settings/system`
  );
  return response.data;
}

export async function updateSystemSettings(
  payload: Partial<SystemSettings>
): Promise<void> {
  await axios.put(`${config.API_BASE_URL}/settings/system`, payload);
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const response = await axios.get<GeneralSettings>(
    `${config.API_BASE_URL}/settings/general`
  );
  return response.data;
}

export async function updateGeneralSettings(
  payload: Partial<GeneralSettings>
): Promise<void> {
  await axios.put(`${config.API_BASE_URL}/settings/general`, payload);
}

export async function getBackup(): Promise<Record<string, unknown>> {
  const response = await axios.get<Record<string, unknown>>(
    `${config.API_BASE_URL}/settings/backup`
  );
  return response.data;
}

export async function restoreBackup(payload: Record<string, unknown>) {
  await axios.post(`${config.API_BASE_URL}/settings/restore`, payload);
}
