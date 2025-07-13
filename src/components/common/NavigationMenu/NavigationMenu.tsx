import React, { useEffect, useRef } from "react";

interface NavigationMenuProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  activeItem = "attendance",
  onItemClick,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: "attendance", label: "Attendance" },
    { id: "students", label: "Students" },
    { id: "events", label: "Events" },
  ];

  useEffect(() => {
    const updateIndicator = () => {
      const activeButton = navRef.current?.querySelector(
        `[data-nav-item="${activeItem}"]`
      ) as HTMLElement;
      const indicator = indicatorRef.current;

      if (activeButton && indicator) {
        const position = activeButton.getBoundingClientRect();
        const navPosition = navRef.current?.getBoundingClientRect();

        if (navPosition) {
          indicator.style.width = `${position.width}px`;
          indicator.style.left = `${position.left - navPosition.left}px`;
        }
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeItem]);

  return (
    <nav className="relative flex items-center space-x-1 py-2" ref={navRef}>
      {navItems.map((item) => (
        <button
          key={item.id}
          data-nav-item={item.id}
          onClick={() => onItemClick?.(item.id)}
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 ease-in-out ${
            activeItem === item.id
              ? "text-black relative"
              : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {item.label}
        </button>
      ))}
      <div
        ref={indicatorRef}
        className="absolute bottom-0 h-[2px] bg-black transition-all duration-200 ease-in-out !m-0"
        style={{ width: "0px", left: "0px" }}
      />
    </nav>
  );
};

export default NavigationMenu;
