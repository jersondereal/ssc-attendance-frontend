/** Shared types used by stores and pages */

export interface AttendanceRecord {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  status: string;
}

export interface StudentRecord {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  rfid?: string;
  profileImageUrl?: string | null;
}

export interface DBStudent {
  id: number;
  student_id: string;
  name: string;
  college?: string;
  course?: string;
  year: string;
  section: string;
  rfid: string;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBAttendance {
  id: number;
  student_id: string;
  event_id: number;
  status: string;
  check_in_time: string;
  created_at: string;
  updated_at: string;
  name: string;
  college?: string;
  course?: string;
  year: string;
  section: string;
}

export interface DBEvent {
  id: number;
  title: string;
  event_date: string;
  location: string;
  fine: number;
  colleges?: Record<string, boolean>;
  courses?: Record<string, boolean>;
  sections?: Record<string, boolean>;
  school_years?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  fine: number;
  colleges?: Record<string, boolean>;
  sections?: Record<string, boolean>;
  schoolYears?: Record<string, boolean>;
}

export interface AuthUser {
  id?: string;
  username: string;
  role: string;
  rawRole?: "administrator" | "moderator" | "viewer";
}
