import { useMemo } from "react";
import { StudentForm, type StudentFormData } from "../StudentForm/StudentForm";

interface EditStudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  initialData: StudentFormData;
}

export const EditStudentForm = ({
  onSubmit,
  onCancel,
  initialData,
}: EditStudentFormProps) => {
  const headerContent = (
    <h2 className="text-sm font-semibold mb-6">Edit Student</h2>
  );

  const resolvedInitialData = useMemo(
    () => ({
      ...initialData,
      rfid: initialData.rfid ?? "",
    }),
    [initialData]
  );

  return (
    <StudentForm
      initialData={resolvedInitialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      headerContent={headerContent}
      submitLabel="Save Changes"
      className="p-5"
      showCancelButton
    />
  );
};
