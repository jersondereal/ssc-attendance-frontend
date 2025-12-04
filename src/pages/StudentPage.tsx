import { AttendancePage } from "./AttendancePage";

interface StudentPageProps {
  currentUser: {
    username: string;
    role: string;
  } | null;
}

export function StudentPage({ currentUser }: StudentPageProps) {
  return <AttendancePage tableType="students" currentUser={currentUser} />;
}
