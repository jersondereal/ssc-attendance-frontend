import React, { useEffect, useMemo, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface NavigationMenuProps {
  currentUserRole?: string;
  hideAll?: boolean;
  disableUnauthorized?: boolean;
}

// 'hiddenForViewer' property drives show/hide logic for viewer role
const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    path: "/overview",
    hiddenForViewer: false,
  },
  {
    id: "attendance",
    label: "Attendance",
    path: "/attendance",
    hiddenForViewer: false,
  },
  {
    id: "students",
    label: "Students",
    path: "/students",
    hiddenForViewer: false,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    hiddenForViewer: true,
  },
];

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  currentUserRole,
  hideAll = false,
  disableUnauthorized = false,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const activeItem =
    pathname === "/" ? "overview" : pathname.replace(/^\//, "");

  const isViewer = currentUserRole?.toLowerCase() === "viewer";
  const navItems = useMemo(() => {
    if (hideAll) return [];
    return NAV_ITEMS;
  }, [hideAll]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = navRef.current?.querySelector(
        `[data-nav-item="${activeItem}"]`
      ) as HTMLElement;
      const indicator = indicatorRef.current;
      const wrapper = wrapperRef.current;

      if (activeEl && indicator && wrapper) {
        const left = activeEl.offsetLeft;
        const width = activeEl.offsetWidth;
        indicator.style.width = `${width}px`;
        indicator.style.left = `${left}px`;
      }
    };

    updateIndicator();
    const nav = navRef.current;
    const wrapper = wrapperRef.current;
    if (nav) nav.addEventListener("scroll", updateIndicator);
    window.addEventListener("resize", updateIndicator);
    const ro = wrapper ? new ResizeObserver(updateIndicator) : null;
    if (wrapper) ro?.observe(wrapper);
    return () => {
      if (nav) nav.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
      if (wrapper && ro) ro.disconnect();
    };
  }, [activeItem, navItems]);

  return (
    <nav
      className="relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
      ref={navRef}
    >
      <div
        ref={wrapperRef}
        className="relative flex items-center space-x-1 pb-2 md:pb-0 md:pt-0 px-4 w-max min-w-full md:min-w-fit md:ml-auto"
      >
        {navItems.map((item) => {
          const isDisabled =
            disableUnauthorized && isViewer && item.hiddenForViewer;
          const baseClass =
            "group inline-flex h-9 md:h-14 w-max items-center justify-center rounded-[8px] px-4 py-2 text-xs font-medium transition-all duration-200 ease-in-out shrink-0";
          const disabledClass = "text-zinc-300 cursor-not-allowed";
          const activeClass = "text-black relative";
          const inactiveClass =
            "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50";

          if (isDisabled) {
            return (
              <span
                key={item.id}
                data-nav-item={item.id}
                className={`${baseClass} ${disabledClass}`}
                aria-disabled="true"
              >
                {item.label}
              </span>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              data-nav-item={item.id}
              className={({ isActive }: { isActive: boolean }) =>
                `${baseClass} ${isActive ? activeClass : inactiveClass}`
              }
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (isDisabled) e.preventDefault();
              }}
            >
              {item.label}
            </NavLink>
          );
        })}
        {navItems.length > 0 && (
          <div
            ref={indicatorRef}
            className="absolute bottom-0 left-0 h-[2px] bg-black transition-[width,left] duration-200 ease-in-out !m-0 pointer-events-none"
            style={{ width: "0px", left: "0px" }}
          />
        )}
      </div>
    </nav>
  );
};

export default NavigationMenu;
