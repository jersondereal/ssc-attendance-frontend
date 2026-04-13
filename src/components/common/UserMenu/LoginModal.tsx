import { useRef } from "react";
import { X } from "lucide-react";
import {
  FaqSection,
  LabeledInput,
  SubmitButton,
} from "../../shared";
import { Modal } from "../Modal/Modal";
import type { LoginFormData } from "./types";
import type { FaqItem } from "../../shared";
import { Phone } from "lucide-react";

// Contact items for FAQ with icons
const contactItems = [
  {
    id: "email",
    label: "essuguiuansc@gmail.com",
    href: "mailto:essuguiuansc@gmail.com",
    icon: "/gmail.svg",
  },
  {
    id: "facebook",
    label: "Supreme Student Council- ESSU Guiuan",
    href: "https://www.facebook.com/share/14h86jqKtSS/?mibextid=wwXIfr",
    icon: "/facebook.svg",
  },
  {
    id: "phone",
    label: "+63 909 919 9236",
    href: "tel:+639099199236",
    icon: "phone" as const,
  },
];

// Custom FAQ items focused on login issues
const loginFaqItems: FaqItem[] = [
  {
    question: "How can I contact the SSC for assistance?",
    answer: (
      <>
        If you experience login issues, you can reach out to the Supreme Student Council (SSC) office using any of the contact options below:
        <div className="flex flex-col gap-1 mt-2">
          {contactItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.id === "facebook" ? "_blank" : undefined}
              rel={item.id === "facebook" ? "noopener noreferrer" : undefined}
              className="flex flex-row items-center gap-3 text-nowrap hover:underline"
            >
              {item.icon === "phone" ? (
                <Phone className="size-4 shrink-0" />
              ) : (
                <img src={item.icon} alt={item.label} className="size-4" />
              )}
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </>
    ),
  },
  {
    question: "What if I forgot my password?",
    answer:
      "Please contact the SSC office or your administrator to reset your password. For security reasons, password reset is not available online.",
  },
  {
    question: "Why does it say my login is blocked?",
    answer:
      "To enhance security, multiple failed login attempts temporarily block your account for a few minutes. Please wait and try again later, or contact the SSC office for help.",
  },
  {
    question: "Why isn't my username working?",
    answer:
      "Make sure you entered your username exactly as registered. If you continue to experience issues, contact the SSC office for verification.",
  },
];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: LoginFormData;
  onFormDataChange: (data: LoginFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoggingIn: boolean;
  isLoginBlocked: boolean;
  blockedUntil: number | null;
  formRef: React.RefObject<HTMLFormElement | null>;
}

export function LoginModal({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  onSubmit,
  isLoggingIn,
  isLoginBlocked,
  blockedUntil,
  formRef,
}: LoginModalProps) {
  // Ref for FAQ section
  const faqRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll handler for "Having problems?"
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (faqRef.current) {
      faqRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6 pt-[50px] max-h-[530px] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
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

        {/* FAQ section */}
        <div className="flex flex-col items-center mt-4">
          <a
            href="#faq-section"
            className="text-sm text-blue-500 text-center p-2"
            onClick={handleSmoothScroll}
          >
            Having problems?
          </a>
          <div id="faq-section" ref={faqRef} className="w-full mt-[100px]">
            <FaqSection items={loginFaqItems} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
