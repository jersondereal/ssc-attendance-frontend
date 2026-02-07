import type { Event } from "./types";

const badgeClass = (hoverEffect: boolean) =>
  `inline-flex items-center justify-center rounded-[8px] border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-colors overflow-hidden border-gray-400 bg-transparent text-gray-700 ${
    hoverEffect ? "hover:bg-gray-200" : ""
  }`;

interface EventBadgesProps {
  event: Event;
  hoverEffect?: boolean;
}

export function EventBadges({ event, hoverEffect = false }: EventBadgesProps) {
  const badges: React.ReactNode[] = [];

  if (event.colleges) {
    if (event.colleges.all) {
      badges.push(
        <span key="colleges-all" className={badgeClass(hoverEffect)}>
          All Colleges
        </span>
      );
    } else {
      Object.entries(event.colleges).forEach(([college, selected]) => {
        if (college !== "all" && selected) {
          badges.push(
            <span
              key={`college-${college}`}
              className={badgeClass(hoverEffect)}
            >
              {college.toUpperCase()}
            </span>
          );
        }
      });
    }
  }

  if (event.sections) {
    if (event.sections.all) {
      badges.push(
        <span key="sections-all" className={badgeClass(hoverEffect)}>
          All Sections
        </span>
      );
    } else {
      Object.entries(event.sections).forEach(([section, selected]) => {
        if (section !== "all" && selected) {
          badges.push(
            <span
              key={`section-${section}`}
              className={badgeClass(hoverEffect)}
            >
              {section.toUpperCase()}
            </span>
          );
        }
      });
    }
  }

  if (event.schoolYears) {
    if (event.schoolYears.all) {
      badges.push(
        <span key="years-all" className={badgeClass(hoverEffect)}>
          All Years
        </span>
      );
    } else {
      Object.entries(event.schoolYears).forEach(([year, selected]) => {
        if (year !== "all" && selected) {
          badges.push(
            <span key={`year-${year}`} className={badgeClass(hoverEffect)}>
              Year {year}
            </span>
          );
        }
      });
    }
  }

  return <>{badges}</>;
}
