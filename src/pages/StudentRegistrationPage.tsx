import axios from "axios";
import { ChevronDown, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AddStudentForm } from "../components/forms/AddStudentForm/AddStudentForm";
import type { StudentFormData } from "../components/forms/StudentForm/StudentForm";
import config from "../config";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../contexts/ToastContext";

const contactItems = [
  {
    id: "email",
    label: "essuguiuansc@gmail.com",
    icon: "/gmail.svg",
  },
  {
    id: "facebook",
    label: "Supreme Student Council- ESSU Guiuan",
    icon: "/facebook.svg",
  },
  {
    id: "phone",
    label: "+63 909 919 9236",
    icon: "phone" as const,
  },
];

const FAQ_ITEMS: { question: string; answer: ReactNode }[] = [
  {
    question: "Who should I contact if I can’t fix the error?",
    answer: (
      <>
        For any registration issues, please visit or contact the SSC office via
        Email or Facebook Messenger for assistance.
        <div className="flex flex-col gap-1 mt-2">
          {contactItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-row items-center gap-3 text-nowrap"
            >
              {item.icon === "phone" ? (
                <Phone className="size-4 shrink-0" />
              ) : (
                <img src={item.icon} alt={item.label} className="size-4" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    question: "I made a mistake in my details. What should I do?",
    answer:
      "Please contact the SSC office so they can update your information in the system.",
  },
  {
    question: "What is an RFID?",
    answer:
      "RFID (Radio Frequency Identification) is a card used to identify students during events and allow faster attendance recording. Each student will be provided an RFID card by the SSC at a later time.",
  },
  {
    question: "Do I need an RFID to register?",
    answer:
      "No. RFID is optional. You can submit the form without it and update it later if needed.",
  },
  {
    question:
      "It says my Student ID is already registered. What does that mean?",
    answer:
      "This Student ID already exists in the system. You may have registered before. If you believe this is a mistake, please contact the SSC office for assistance.",
  },
  {
    question: "My RFID is already in use. What should I do?",
    answer:
      "Each RFID can only be linked to one student. Please double-check the RFID number or register without it and update later through the SSC office.",
  },
  {
    question:
      "I’m getting an error saying some details are already registered.",
    answer:
      "Some of the information you entered already exists in the system. Please review your details carefully or reach out to the SSC office for help.",
  },
];

const getFriendlyError = (raw: string | undefined) => {
  if (!raw) return "Registration failed. Please try again.";
  const normalized = raw.toLowerCase();
  if (normalized.includes("students_student_id_key")) {
    return "That student ID is already registered. Please use a different ID.";
  }
  if (normalized.includes("students_rfid_key")) {
    return "That RFID is already in use. Please use a different RFID.";
  }
  if (normalized.includes("duplicate key value violates unique constraint")) {
    return "Some of the details are already registered. Please double-check.";
  }
  return raw;
};

export function StudentRegistrationPage() {
  const { systemSettings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const registrationEnabled =
    systemSettings.featureAccess.viewer.studentRegistration;

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen max-w-[50rem] px-5 w-full mx-auto py-10 items-center flex flex-col">
        <h1 className="text-2xl font-semibold text-center mt-8">
          Student registration is temporarily unavailable
        </h1>
        <p className="text-gray-500 text-sm text-center mt-3 max-w-xl">
          Registration is currently disabled. Please check back later or contact
          the SSC office for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[50rem] px-5 w-full mx-auto py-10 items-center flex flex-col">
      <img
        src="/logo.png"
        alt="SSC Logo"
        className="min-h-32"
        style={{ maxHeight: "2rem" }}
      />
      <h1 className="font-semibold text-center mt-5 leading-tight tracking-tight flex flex-col items-center justify-center">
        <span className="text-2xl">Supreme Student Council</span>
        <span className="text-xl">ESSU Guiuan Campus</span>
      </h1>
      <h2 className="text-lg font-medium text-center mt-2 text-zinc-500">
        Attendance Monitoring System
      </h2>
      <div className="border border-border-dark w-full p-3 rounded-[20px] mt-6 border-t-4 border-t-green-700 shadow-lg">
        {submitMessage ? (
          <div className="flex flex-col items-center text-center gap-10 py-14">
            <h2 className="text-lg font-bold">🎉Registration Successful</h2>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-fit rounded-[10px] border border-border-dark bg-white py-2 px-8 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Continue to Attendance Portal
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-center mt-6">
              Student Registration
            </h2>
            {submitError && (
              <p className="mt-3 text-sm text-red-600 text-center" role="alert">
                {submitError}
              </p>
            )}
            <AddStudentForm
              key={formKey}
              onSubmit={async (data: StudentFormData) => {
                if (isSubmitting) return;
                setSubmitError(null);
                setSubmitMessage(null);
                setIsSubmitting(true);
                try {
                  await axios.post(`${config.API_BASE_URL}/students`, {
                    student_id: data.studentId,
                    name: data.name,
                    college: data.college.toLowerCase(),
                    year: data.year,
                    section: data.section.toLowerCase(),
                    rfid: (data.rfid ?? "").trim(),
                  });
                  setSubmitMessage("Registration submitted successfully.");
                  showToast("Registration submitted successfully", "success");
                  setFormKey((prev) => prev + 1);
                } catch (error: unknown) {
                  let message = "Registration failed";
                  if (axios.isAxiosError(error)) {
                    const data = error.response?.data as
                      | { error?: string; message?: string }
                      | undefined;
                    const rawMessage =
                      data?.error ??
                      data?.message ??
                      error.message ??
                      "Registration failed";
                    message = getFriendlyError(rawMessage);
                  }
                  setSubmitError(message);
                  showToast(message, "error");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onCancel={() => {}}
              showHeader={false}
              className="w-full"
              showCancelButton={false}
            />
          </>
        )}
      </div>
      <div className="w-full mt-14">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={item.question}
                className="w-full border border-border-dark rounded-[12px] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium">{item.question}</span>
                  <span className="text-gray-400 text-sm">
                    <ChevronDown
                      className={`size-4 transition-all duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 pt-1 text-sm text-gray-600">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
