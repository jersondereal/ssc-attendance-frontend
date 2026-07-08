import { Link } from "react-router-dom";
import type { FaqItem } from "./types";

const studentsPageLink = (
  <Link
    to="/students"
    className="font-semibold text-green-600 underline hover:text-green-500 transition-colors"
  >
    Students page
  </Link>
);

/** Default FAQ list for registration/login. Pass to FaqSection as items prop. */
export const defaultFaqItems: FaqItem[] = [
  {
    question: "I couldn't download my QR code. What should I do?",
    answer: (
      <>
        No problem — you can download it anytime from the {studentsPageLink}.
        Just search your name, open your record, and download the QR code from
        there.
      </>
    ),
  },
  {
    question: "It says my Student ID is already registered. What does that mean?",
    answer: (
      <>
        You may have already registered before. Please verify by going to the{" "}
        {studentsPageLink} and searching your Student ID to check your record.
      </>
    ),
  },
  {
    question: "I still need help. Who can I contact?",
    answer: (
      <>
        For any registration issues, please contact IT Support:
        <div className="flex flex-row items-center gap-3 text-nowrap mt-2">
          <img src="/facebook.svg" alt="Facebook" className="size-4" />
          <span>Jerson De Real Caibog</span>
        </div>
      </>
    ),
  },
];
