import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddStudentForm } from "../components/forms/AddStudentForm/AddStudentForm";
import type { StudentFormData } from "../components/forms/StudentForm/StudentForm";
import {
  defaultFaqItems,
  FaqSection,
  RegistrationSuccessView,
} from "../components/shared";
import config from "../config";
import { useToast } from "../contexts/ToastContext";
import type { DBStudent } from "../stores/types";
import { useSettingsStore } from "../stores/useSettingsStore";

const getFriendlyError = (raw: string | undefined) => {
  if (!raw) return "Registration failed. Please try again.";
  const normalized = raw.toLowerCase();
  if (normalized.includes("students_student_id_key")) {
    return "That student ID is already registered. Please make sure you entered your student ID correctly.";
  }
  if (normalized.includes("students_rfid_key")) {
    return "That RFID is already in use. Please make sure you entered your RFID correctly.";
  }
  if (normalized.includes("duplicate key value violates unique constraint")) {
    return "Some of the details are already registered. Please double-check.";
  }
  return raw;
};

export function StudentRegistrationPage() {
  const systemSettings = useSettingsStore((s) => s.systemSettings);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [registeredStudent, setRegisteredStudent] = useState<DBStudent | null>(
    null,
  );
  const registrationEnabled =
    systemSettings.featureAccess.viewer.studentRegistration;

  const uploadProfileImage = async (file: File, year: string) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("year", year);
    const response = await axios.post<{ url: string }>(
      `${config.API_BASE_URL}/upload/profile-image`,
      formData,
    );
    const imageUrl = response.data?.url;
    if (!imageUrl) {
      throw new Error("Image upload failed");
    }
    return { imageUrl };
  };

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
      <div className="w-full mt-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <FaqSection items={defaultFaqItems} />
      </div>
      <div className="border border-gray-300 w-full md:p-6 rounded-[20px] mt-8 border-t-4 border-t-green-700 shadow-lg bg-white">
        {submitMessage && registeredStudent ? (
          <RegistrationSuccessView
            student={registeredStudent}
            onDone={() => navigate("/")}
            title="Registration Successful 🎉"
            description={
              <>
                Please download and securely store your QR code,{" "}
                <br className="hidden sm:block" /> as it is required for
                attendance verification.
              </>
            }
            doneLabel="Continue to Attendance Portal"
            className="py-14"
          />
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
                setRegisteredStudent(null);
                setIsSubmitting(true);
                try {
                  let profileImageUrl: string | null = null;
                  if (data.profileImageFile) {
                    const uploaded = await uploadProfileImage(
                      data.profileImageFile,
                      data.year,
                    );
                    profileImageUrl = uploaded.imageUrl;
                  }
                  const createdStudent = (
                    await axios.post(`${config.API_BASE_URL}/students`, {
                      student_id: data.studentId,
                      name: data.name,
                      college: data.college.toLowerCase(),
                      year: data.year,
                      section: data.section.toLowerCase(),
                      rfid: (data.rfid ?? "").trim(),
                      profile_image_url: profileImageUrl,
                      // Self-service: if this ID is already taken, register with
                      // a " (n)"-suffixed ID instead of failing. Admins reconcile
                      // these later. Not sent from admin-side adds.
                      allow_duplicate_fallback: true,
                    })
                  ).data as DBStudent;
                  setRegisteredStudent(createdStudent);
                  setSubmitMessage("Registration submitted successfully.");
                  showToast("Registration submitted successfully", "success");
                  setFormKey((prev) => prev + 1);
                } catch (error: unknown) {
                  // Same person re-registering (same ID + same name): not an
                  // error — let them know they're already in the system.
                  if (
                    axios.isAxiosError(error) &&
                    (error.response?.data as { alreadyRegistered?: boolean })
                      ?.alreadyRegistered
                  ) {
                    const msg =
                      "You're already registered. Please contact the SSC office if you think this is a mistake.";
                    setSubmitError(msg);
                    showToast(msg, "warning");
                    return;
                  }
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
            <p className="px-6 pb-6 text-center text-sm text-gray-500">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-semibold text-green-600 underline hover:text-green-500 transition-colors"
              >
                Proceed to Homepage
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
