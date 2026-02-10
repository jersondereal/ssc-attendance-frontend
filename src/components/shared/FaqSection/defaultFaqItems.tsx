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
    question: "Who should I contact if I can't fix the error?",
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
      "I'm getting an error saying some details are already registered.",
    answer:
      "Some of the information you entered already exists in the system. Please review your details carefully or reach out to the SSC office for help.",
  },
];
