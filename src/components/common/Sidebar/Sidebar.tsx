import {
  Bot,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { UserMenu } from "../UserMenu/UserMenu";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  hiddenForViewer: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    hiddenForViewer: false,
  },
  {
    id: "events",
    label: "Events",
    path: "/events",
    icon: CalendarDays,
    hiddenForViewer: false,
  },
  {
    id: "students",
    label: "Students",
    path: "/students",
    icon: Users,
    hiddenForViewer: false,
  },
  {
    id: "ai-chat",
    label: "AI Chat",
    path: "/ai-chat",
    icon: Bot,
    hiddenForViewer: true,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: Settings,
    hiddenForViewer: true,
  },
];

interface SidebarProps {
  currentUserRole?: string;
  hideAll?: boolean;
}

const linkBase =
  "flex items-center gap-3 rounded-[8px] p-3 text-sm font-medium transition-colors";
const linkActive = "bg-sscThemeLight text-sscThemeIcon font-semibold";
const linkInactive = "text-gray-500 hover:bg-gray-100 hover:text-gray-800";

function Brand() {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-3 pr-4">
      <img
        src="/logo.png"
        alt="SSC Logo"
        className="h-8 w-auto"
        style={{ maxHeight: "2rem" }}
      />
      <span className="text-[12px] font-semibold leading-tight text-gray-900">
        Supreme Student Council
        <span className="block font-normal text-gray-500">ESSU Guiuan</span>
      </span>
    </NavLink>
  );
}

// Track the md breakpoint in JS so only one layout (desktop OR mobile) mounts
// at a time — otherwise UserMenu (auto-login + login/account modals) would
// mount multiple times.
function useIsDesktop() {
  const query = "(min-width: 768px)";
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export const Sidebar = ({ currentUserRole, hideAll = false }: SidebarProps) => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const isViewer = currentUserRole?.toLowerCase() === "viewer";

  const navItems = hideAll
    ? []
    : isViewer
      ? NAV_ITEMS.filter((item) => !item.hiddenForViewer)
      : NAV_ITEMS;

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }: { isActive: boolean }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  if (isDesktop) {
    return (
      <aside className="sticky top-0 flex h-screen w-65 shrink-0 flex-col border-r border-gray-300 bg-white">
        <div className="flex h-16 items-center border-b border-gray-300 px-4">
          <Brand />
        </div>
        {navLinks}
        <div className="border-t border-gray-300 p-3">
          <UserMenu direction="up" />
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center justify-between border-b border-gray-300 bg-white px-4">
        <Brand />
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-[8px] p-1.5 text-gray-700 hover:bg-gray-100"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* Drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-65 flex-col border-r border-border-dark bg-white transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border-dark px-4">
          <Brand />
          <button
            type="button"
            aria-label="Close menu"
            className="rounded-[8px] p-1.5 text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-6" />
          </button>
        </div>
        {navLinks}
        <div className="border-t border-border-dark p-3">
          <UserMenu direction="up" />
        </div>
      </aside>
    </>
  );
};
