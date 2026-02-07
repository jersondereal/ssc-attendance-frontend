import React, { useEffect, useMemo, useState } from "react";
import { collegesToOptions, getColleges } from "../../../api/colleges";
import { Button } from "../../common/Button/Button";
import { DropdownSelector } from "../../common/DropdownSelector/DropdownSelector";
import { Textbox } from "../../common/Textbox/Textbox";

export interface StudentFormData {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  rfid?: string;
}

interface StudentFormProps {
  initialData: StudentFormData;
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  headerContent?: React.ReactNode;
  submitLabel: string;
  className?: string;
  showCancelButton?: boolean;
}

export const StudentForm = ({
  initialData,
  onSubmit,
  onCancel,
  headerContent,
  submitLabel,
  className = "p-6",
  showCancelButton = true,
}: StudentFormProps) => {
  const [collegeOptions, setCollegeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [formData, setFormData] = useState<StudentFormData>({
    ...initialData,
    rfid: initialData.rfid ?? "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      ...initialData,
      rfid: initialData.rfid ?? "",
    });
  }, [initialData]);

  useEffect(() => {
    getColleges()
      .then((list) => setCollegeOptions(collegesToOptions(list)))
      .catch(() => setCollegeOptions([]));
  }, []);

  const yearOptions = [
    { value: "1", label: "Year Level 1" },
    { value: "2", label: "Year Level 2" },
    { value: "3", label: "Year Level 3" },
    { value: "4", label: "Year Level 4" },
  ];

  const sectionOptions = [
    { value: "a", label: "Section A" },
    { value: "b", label: "Section B" },
    { value: "c", label: "Section C" },
  ];

  const collegeValue = useMemo(() => {
    const current = formData.college ?? "";
    if (!current) return "";
    const matched = collegeOptions.find(
      (opt) => opt.value.toLowerCase() === current.toLowerCase()
    );
    return matched?.value ?? current;
  }, [formData.college, collegeOptions]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "studentId") {
      const cleaned = value.replace(/[^0-9-]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentIdPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("Text");
    if (/[^0-9-]/.test(pasted)) {
      e.preventDefault();
      const cleaned = pasted.replace(/[^0-9-]/g, "");
      const input = e.target as HTMLInputElement;
      const { selectionStart, selectionEnd, value } = input;
      const before = value.slice(0, selectionStart || 0);
      const after = value.slice(selectionEnd ?? value.length);
      const newValue = before + cleaned + after;
      setFormData((prev) => ({
        ...prev,
        studentId: newValue,
      }));
    }
  };

  const handleStudentIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key.length === 1 &&
      !/[0-9-]/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  };

  const handleDropdownChange =
    (name: keyof StudentFormData) => (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const studentId = formData.studentId?.trim() ?? "";
    const name = formData.name?.trim() ?? "";
    const college = formData.college?.trim() ?? "";
    const year = formData.year?.trim() ?? "";
    const section = formData.section?.trim() ?? "";
    const rfid = formData.rfid?.trim() ?? "";

    const missing: string[] = [];
    if (!studentId) missing.push("Student ID");
    if (!name) missing.push("Full Name");
    if (!college) missing.push("College");
    if (!year) missing.push("Year Level");
    if (!section) missing.push("Section");

    if (missing.length > 0) {
      setSubmitError(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    onSubmit({
      studentId,
      name,
      college,
      year,
      section,
      rfid,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {headerContent}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <Textbox
              name="studentId"
              placeholder="Enter student ID (e.g. 23-0001)"
              required
              className="w-full py-2"
              value={formData.studentId}
              onChange={handleChange}
              onKeyDown={handleStudentIdKeyDown}
              onPaste={handleStudentIdPaste}
              inputMode="text"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Textbox
              name="name"
              placeholder="Enter full name (e.g. John Doe)"
              required
              className="w-full py-2"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College
            </label>
            <DropdownSelector
              name="college"
              options={collegeOptions}
              placeholder="Select college"
              className="!w-full !py-0 !h-10"
              textClassName="text-[16px]"
              value={collegeValue}
              onChange={handleDropdownChange("college")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Level
            </label>
            <DropdownSelector
              name="year"
              options={yearOptions}
              placeholder="Select year"
              className="!w-full !py-0 !h-10 "
              textClassName="text-[16px]"
              value={formData.year}
              onChange={handleDropdownChange("year")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 md:col-span-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <DropdownSelector
              name="section"
              options={sectionOptions}
              placeholder="Select section"
              className="!w-full !py-0 !h-10"
              textClassName="text-[16px]"
              value={formData.section?.toLowerCase() ?? ""}
              onChange={handleDropdownChange("section")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFID
            </label>
            <Textbox
              name="rfid"
              placeholder="Enter RFID (optional)"
              className="w-full py-2"
              value={formData.rfid ?? ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex gap-3 mt-8">
        {showCancelButton && (
          <Button
            type="button"
            label="Cancel"
            variant="secondary"
            className="flex-1 py-2 !text-base"
            onClick={onCancel}
          />
        )}
        <Button
          type="submit"
          label={submitLabel}
          variant="primary"
          className="flex-1 py-2 bg-zinc-700 text-white hover:bg-zinc-600 !text-base"
        />
      </div>
    </form>
  );
};
