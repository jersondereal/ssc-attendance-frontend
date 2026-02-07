export interface User {
  id: string;
  username: string;
  role: "administrator" | "moderator" | "viewer";
}

export interface UserFormData {
  username: string;
  password: string;
  role: User["role"];
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginAttempts {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

export interface UserMenuProps {
  onLogout?: () => void;
  onUserChange?: (user: { username: string; role: string } | null) => void;
}

export const ROLE_OPTIONS = [
  {
    value: "administrator",
    label: "Administrator",
    description:
      "Full access to all features including user management, student management, and attendance tracking",
  },
  {
    value: "moderator",
    label: "Moderator",
    description:
      "Can manage students and attendance, but cannot manage user accounts",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to view attendance and student data only",
  },
] as const;

export const ROLE_PRIORITY: Record<User["role"], number> = {
  administrator: 1,
  moderator: 2,
  viewer: 3,
};

export function getRoleLabel(role: User["role"] | undefined): string {
  if (!role) return "";
  switch (role) {
    case "administrator":
      return "Administrator";
    case "moderator":
      return "Moderator";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}
