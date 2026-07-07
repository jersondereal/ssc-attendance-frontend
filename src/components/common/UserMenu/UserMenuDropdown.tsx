import HelpIcon from "@mui/icons-material/Help";
import KeyIcon from "@mui/icons-material/Key";
import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User } from "./types";

interface UserMenuDropdownProps {
  currentUser: User | null;
  isOpen: boolean;
  onToggle: () => void;
  onAccountsClick: () => void;
  onHelpClick: () => void;
  onLoginAsAdmin: () => void;
  onLogout: () => void;
  direction?: "up" | "down";
}

export function UserMenuDropdown({
  currentUser,
  isOpen,
  onToggle,
  onAccountsClick,
  onHelpClick,
  onLoginAsAdmin,
  onLogout,
  direction = "down",
}: UserMenuDropdownProps) {
  const isAdmin = currentUser?.role === "administrator";
  const isStudent = !currentUser || currentUser.role === "viewer";

  // Keep the dropdown rendered briefly after closing to allow transition-out (and appear immediately when opening)
  const [show, setShow] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen); // For transition-in
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      // Wait for next tick to enable transition for opening
      setTimeout(() => setVisible(true), 10);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      setVisible(false);
      // Wait for transition to finish before hiding the dropdown
      timeoutRef.current = setTimeout(() => setShow(false), 150);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  return (
    <>
      {direction === "up" ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-[8px] p-2 text-left transition-colors hover:bg-gray-100"
        >
          <span className="grid shrink-0 place-items-center rounded-full bg-gray-700 p-2">
            <UserRound className="h-4 w-4 text-gray-300" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-gray-800">
              @{currentUser?.username ?? "guest"}
            </span>
            <span className="truncate text-xs capitalize text-gray-500">
              {currentUser?.role ?? "viewer"}
            </span>
          </span>
        </button>
      ) : (
        <div
          className="grid place-items-center border border-gray-800 rounded-full relative p-2 cursor-pointer hover:bg-gray-800 text-gray-300 hover:text-gray-100 transition-colors hover:border-gray-700 focus:ring-2 focus:ring-zinc-200 bg-gray-700"
          onClick={onToggle}
        >
          <UserRound className="text-gray-300 w-4 h-4" />
        </div>
      )}

      {show && (
        <div
          className={`
            absolute bg-white border border-gray-300 rounded-[8px] shadow-lg z-10 min-w-[14rem]
            ${direction === "up" ? "left-0 bottom-full mb-2" : "right-0 top-full mt-2"}
            transition-all duration-150
            ${
              visible
                ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                : `opacity-0 scale-95 pointer-events-none ${direction === "up" ? "translate-y-2" : "-translate-y-2"}`
            }
          `}
          style={{ willChange: "opacity, transform" }}
        >
          <div className="items-center gap-3 px-4 text-gray-700 font-medium text-sm border-b border-border-dark py-3">
            <span>@{currentUser?.username}</span>
          </div>

          <div className="flex flex-col px-1">
            <button
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-normal rounded-[8px] mt-1 ${
                !isAdmin
                  ? "text-gray-400 cursor-not-allowed bg-gray-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                if (isAdmin) {
                  onAccountsClick();
                }
              }}
              disabled={!isAdmin}
              title={
                !isAdmin
                  ? "Only Administrators can manage accounts"
                  : "Manage user accounts"
              }
            >
              <KeyIcon sx={{ fontSize: "1rem" }} />
              <span>Accounts</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-normal rounded-[8px]"
              onClick={onHelpClick}
            >
              <HelpIcon sx={{ fontSize: "1rem" }} />
              <span>Help</span>
            </button>
          </div>

          <div className="border-t border-gray-300 mt-1" />

          <div className="flex flex-col px-1">
            {isStudent ? (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-5 py-2 my-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-normal rounded-[8px]"
                onClick={onLoginAsAdmin}
              >
                <span>Login as Admin</span>
              </button>
            ) : (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-5 py-2 my-1 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 font-normal rounded-[8px]"
                onClick={onLogout}
              >
                <span>Log out as Admin</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
