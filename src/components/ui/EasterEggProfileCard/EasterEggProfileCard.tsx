import { Instagram, X } from "lucide-react";

interface EasterEggProfileCardProps {
  name: string;
  studentId: string;
  college: string;
  year: string;
  section: string;
  instagramHandle: string;
  photoUrl: string;
  onClose: () => void;
}

export function EasterEggProfileCard({
  name,
  studentId,
  college,
  year,
  section,
  instagramHandle,
  photoUrl,
  onClose,
}: EasterEggProfileCardProps) {
  return (
    <div className="relative w-[22rem] max-w-[90vw] overflow-hidden rounded-[20px] bg-white shadow-lg">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
      >
        <X className="size-4" />
      </button>

      <div className="relative h-76 w-full bg-gray-100">
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col items-center gap-3 p-6 pt-4 text-center">
        <span className="inline-block rounded-full bg-[var(--color-ssc-light)] px-3 py-1 text-[11px] font-semibold text-[var(--color-ssc-icon)]">
          SSC AMS Developer
        </span>
        <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
        <a
          href={`https://instagram.com/${instagramHandle.replace(/^@/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <Instagram className="size-4" />
          {instagramHandle}
        </a>

        <div className="flex w-full flex-row justify-between divide-x divide-gray-300 border-t border-gray-300 pt-4 mt-3 text-center">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-gray-600">
              ID
            </div>
            <div className="mt-1 text-xs font-medium text-gray-800">
              {studentId}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-gray-600">
              College
            </div>
            <div className="mt-1 text-xs font-medium text-gray-800">
              {college}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wide text-gray-600">
              Year
            </div>
            <div className="mt-1 text-xs font-medium text-gray-800">
              {year}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wide text-gray-600">
              Section
            </div>
            <div className="mt-1 text-xs font-medium text-gray-800">
              {section}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
