import { Phone } from "lucide-react";
import type { FaqItem } from "./types";

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

/** Default FAQ list for registration/login. Pass to FaqSection as items prop. */
export const defaultFaqItems: FaqItem[] = [
  {
    question: "I made a mistake in my details. What should I do?",
    answer:
    "Please contact the SSC office so they can update your information in the system.",
  },
  {
    question:
    "It says my Student ID is already registered. What does that mean?",
    answer:
    "This Student ID already exists in the system. You may have registered before. If you believe this is a mistake, please contact the SSC office for assistance.",
  },
  {
    question:
    "I'm getting an error saying some details are already registered.",
    answer:
    "Some of the information you entered already exists in the system. Please review your details carefully or reach out to the SSC office for help.",
  },
  {
    question: "Who should I contact if I can't fix the error?",
    answer: (
      <>
        For any registration issues, please visit or contact the SSC office via
        Email, Contact Number, or Facebook Messenger for assistance.
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
];
