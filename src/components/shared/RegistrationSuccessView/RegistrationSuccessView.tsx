import html2canvas from "html2canvas";
import { useRef } from "react";
import { StudentQRCard } from "../../ui/StudentQRCard/StudentQRCard";
import type { DBStudent } from "../../../stores/types";
import { useToast } from "../../../contexts/ToastContext";

export interface RegistrationSuccessViewProps {
  student: DBStudent;
  onDone: () => void;
  /** Primary action button label */
  doneLabel?: string;
  /** Heading text */
  title?: string;
  /** Description below the title */
  description?: React.ReactNode;
  /** Optional class for the root container */
  className?: string;
}

const defaultTitle = "Registration successful";
const defaultDescription = (
  <>
    Please download and securely store the QR code; it is required for
    attendance verification.
  </>
);
const defaultDoneLabel = "Done";

export function RegistrationSuccessView({
  student,
  onDone,
  doneLabel = defaultDoneLabel,
  title = defaultTitle,
  description = defaultDescription,
  className = "",
}: RegistrationSuccessViewProps) {
  const { showToast } = useToast();
  const qrCardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!qrCardRef.current) {
      showToast("Failed to download QR code", "error");
      return;
    }
    try {
      const canvas = await html2canvas(qrCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${student.student_id}_qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      showToast("Failed to download QR code", "error");
    }
  };

  const college = (student.college ?? student.course ?? "").toUpperCase();

  return (
    <div
      className={`flex flex-col items-center text-center gap-4 ${className}`}
    >
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-700 max-w-[450px] w-full">
          {description}
        </p>
      </div>
      <div className="border border-border-dark rounded-[10px] w-full max-w-[450px]">
        <StudentQRCard
          ref={qrCardRef}
          studentId={student.student_id}
          name={student.name}
          college={college}
          year={student.year}
          section={student.section}
          size={120}
        />
      </div>
      <div className="max-w-[450px] w-full flex flex-col gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full rounded-[10px] border border-green-600 bg-green-700 h-10 text-sm font-medium text-white hover:bg-green-800"
        >
          Download QR Code
        </button>
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-[10px] border border-border-dark bg-white h-10 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {doneLabel}
        </button>
      </div>
    </div>
  );
}
