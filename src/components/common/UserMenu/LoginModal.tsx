import { LabeledInput, SecondaryButton, SubmitButton } from "../../shared";
import { Modal } from "../Modal/Modal";
import type { LoginFormData } from "./types";

interface LoginModalProps {
  isOpen: boolean;
  formData: LoginFormData;
  onFormDataChange: (data: LoginFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoggingIn: boolean;
  isLoginBlocked: boolean;
  blockedUntil: number | null;
  formRef: React.RefObject<HTMLFormElement | null>;
  onQuickFillStudent?: () => void;
}

export function LoginModal({
  isOpen,
  formData,
  onFormDataChange,
  onSubmit,
  isLoggingIn,
  isLoginBlocked,
  blockedUntil,
  formRef,
  onQuickFillStudent,
}: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="p-6">
        <img
          src="/logo.png"
          alt="SSC Logo"
          className="w-24 mx-auto mb-3 rounded-full shadow"
        />
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Welcome Back</h2>
            <p className="text-sm text-gray-500">Please login to continue</p>
          </div>
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <LabeledInput
            label="Username"
            value={formData.username}
            onChange={(username) => onFormDataChange({ ...formData, username })}
            required
            autoFocus
            disabled={isLoginBlocked}
            inputClassName="!text-base md:text-sm"
          />
          <LabeledInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(password) => onFormDataChange({ ...formData, password })}
            required
            disabled={isLoginBlocked}
            inputClassName="!text-base md:text-sm"
          />
          <div className="pt-2">
            <SubmitButton
              disabled={isLoginBlocked || isLoggingIn}
              loading={isLoggingIn}
              className="w-full"
            >
              {isLoginBlocked && blockedUntil ? (
                <>
                  Too many failed attempts.
                  <br />
                  Try again in{" "}
                  {Math.ceil((blockedUntil - Date.now()) / (60 * 1000))} minutes
                </>
              ) : (
                "Login"
              )}
            </SubmitButton>
          </div>
        </form>

        {onQuickFillStudent && (
          <div className="mt-3">
            <SecondaryButton onClick={onQuickFillStudent}>
              Login as Student
            </SecondaryButton>
          </div>
        )}
      </div>
    </Modal>
  );
}
