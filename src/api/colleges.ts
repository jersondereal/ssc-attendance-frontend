import axios from "axios";
import config from "../config";

export interface College {
  id: number;
  code: string;
  name: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export async function getColleges(): Promise<College[]> {
  const response = await axios.get<College[]>(
    `${config.API_BASE_URL}/colleges`
  );
  return response.data;
}

export async function getCollege(id: number): Promise<College> {
  const response = await axios.get<College>(
    `${config.API_BASE_URL}/colleges/${id}`
  );
  return response.data;
}

export async function createCollege(body: {
  code: string;
  name: string;
  display_order?: number;
}): Promise<College> {
  const response = await axios.post<College>(
    `${config.API_BASE_URL}/colleges`,
    body
  );
  return response.data;
}

export async function updateCollege(
  id: number,
  body: { code?: string; name?: string; display_order?: number }
): Promise<College> {
  const response = await axios.put<College>(
    `${config.API_BASE_URL}/colleges/${id}`,
    body
  );
  return response.data;
}

export async function deleteCollege(id: number): Promise<void> {
  await axios.delete(`${config.API_BASE_URL}/colleges/${id}`);
}

/** Map colleges from API to { value, label } for dropdowns */
export function collegesToOptions(
  colleges: College[]
): { value: string; label: string }[] {
  return colleges.map((c) => ({ value: c.code, label: `${c.name} (${c.code.toUpperCase()})` }));
}
