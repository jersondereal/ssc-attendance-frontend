import axios from "axios";
import { useState } from "react";
import { AddStudentForm } from "../components/forms/AddStudentForm/AddStudentForm";
import type { StudentFormData } from "../components/forms/StudentForm/StudentForm";
import config from "../config";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../contexts/ToastContext";

export function StudentRegistrationPage() {
  const { systemSettings } = useSettings();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
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
      <div className="border border-border-dark w-full p-3 pt-8 rounded-[20px] mt-6 border-t-4 border-t-green-700 shadow-lg">
        <h2 className="text-lg font-bold text-center">Student Registration</h2>
        {submitMessage && (
          <p className="mt-3 text-sm text-green-700 text-center" role="status">
            {submitMessage}
          </p>
        )}
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
              setSubmitMessage(
                "Registration submitted successfully. You may close this page."
              );
              showToast("Registration submitted successfully", "success");
              setFormKey((prev) => prev + 1);
            } catch (error: unknown) {
              const message = axios.isAxiosError(error)
                ? error.response?.data?.message || "Registration failed"
                : "Registration failed";
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
      </div>
    </div>
  );
}
