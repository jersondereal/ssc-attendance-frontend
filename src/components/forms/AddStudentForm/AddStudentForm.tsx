import { Ellipsis, Link2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { StudentForm, type StudentFormData } from "../StudentForm/StudentForm";

interface AddStudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  showHeader?: boolean;
  className?: string;
  showCancelButton?: boolean;
}

export const AddStudentForm = ({
  onSubmit,
  onCancel,
  showHeader = true,
  className = "",
  showCancelButton = true,
}: AddStudentFormProps) => {
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const isStudentRegistrationPage = location.pathname === "/register";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyRegistrationLink = async () => {
    const link = `${window.location.origin}/register`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Registration link copied to clipboard", "success");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Registration link copied to clipboard", "success");
    }
    setIsMenuOpen(false);
  };

  const headerContent = showHeader ? (
    <div className="flex flex-row relative items-center justify-between mb-6">
      <h2 className="text-sm font-semibold">
        {isStudentRegistrationPage
          ? "Student Registration"
          : "Register New Student"}
      </h2>
      {!isStudentRegistrationPage && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-all"
            aria-label="Registration menu"
          >
            <Ellipsis className="size-5" />
          </button>
          <div
            className={`absolute right-0 top-full mt-1 bg-white border border-border-dark rounded-[8px] shadow-lg z-10 w-fit p-1.5 origin-top-right transition-all duration-200 ease-out ${
              isMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <button
              type="button"
              onClick={handleCopyRegistrationLink}
              className="w-fit rounded-[8px] text-left px-3 py-2 hover:bg-zinc-100 text-sm flex items-center gap-3"
            >
              <Link2 className="size-4 shrink-0" />
              <span className="leading-none text-nowrap">
                Copy registration link
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const initialData = useMemo<StudentFormData>(
    () => ({
      studentId: "",
      name: "",
      college: "",
      year: "",
      section: "",
      rfid: "",
    }),
    []
  );

  return (
    <StudentForm
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      headerContent={headerContent}
      submitLabel="Register"
      className={`p-6 ${className}`}
      showCancelButton={showCancelButton}
    />
  );
};
