import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FaqItem } from "./types";

export type { FaqItem } from "./types";

interface FaqSectionProps {
  items: FaqItem[];
}

export function FaqSection({ items }: FaqSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
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
  );
}
