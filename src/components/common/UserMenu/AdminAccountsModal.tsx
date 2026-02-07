import AddIcon from "@mui/icons-material/Add";
import { useState, useRef, useEffect } from "react";
import { Ellipsis } from "lucide-react";
import { Modal } from "../Modal/Modal";
import type { User } from "./types";
import { getRoleLabel, ROLE_PRIORITY } from "./types";

interface AdminAccountsModalProps {
  isOpen: boolean;
  adminAccounts: User[];
  onClose: () => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export function AdminAccountsModal({
  isOpen,
  adminAccounts,
  onClose,
  onAddUser,
  onEditUser,
  onDeleteUser,
}: AdminAccountsModalProps) {
  const sortedAccounts = [...adminAccounts].sort((a, b) => {
    if (a.username === "president") return -1;
    if (b.username === "president") return 1;
    return ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
  });

  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);
  const [menuTransition, setMenuTransition] = useState<{ [k: number]: boolean }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMenuClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // If menu is already open, close it (with transition)
    if (openMenuIdx === idx) {
      setMenuTransition((prev) => ({ ...prev, [idx]: false }));
      setTimeout(() => setOpenMenuIdx(null), 150);
    } else {
      if (openMenuIdx !== null) {
        // Close previous
        setMenuTransition((prev) => ({ ...prev, [openMenuIdx]: false }));
        setTimeout(() => {
          setOpenMenuIdx(idx);
          setMenuTransition((prev) => ({ ...prev, [idx]: true }));
        }, 150);
      } else {
        setOpenMenuIdx(idx);
        setTimeout(() => setMenuTransition((prev) => ({ ...prev, [idx]: true })), 10);
      }
    }
  };

  function handleBlur(e: React.FocusEvent<HTMLButtonElement>, idx: number) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setMenuTransition((prev) => ({ ...prev, [idx]: false }));
      setTimeout(() => setOpenMenuIdx(null), 150);
    }
  }

  // Reset transitions when closing modal or on account change
  useEffect(() => {
    if (!isOpen) {
      setOpenMenuIdx(null);
      setMenuTransition({});
    }
  }, [isOpen, adminAccounts.length]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5 rounded-[8px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm font-semibold">Accounts Management</h2>
          <button
            type="button"
            onClick={onAddUser}
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm bg-zinc-700 text-white rounded-[8px] hover:bg-zinc-600 transition-colors"
          >
            <AddIcon sx={{ fontSize: "1rem" }} />
            Add User
          </button>
        </div>
        <div
          ref={containerRef}
          className="flex flex-col bg-white rounded-[8px] gap-1.5 divide-y divide-zinc-200 max-h-[70vh] overflow-y-auto"
        >
          {sortedAccounts.map((user, idx) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-2 px-3 group"
            >
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-sm text-gray-500">
                  {getRoleLabel(user.role)}
                </div>
              </div>
              <div className="flex items-center relative">
                <button
                  type="button"
                  tabIndex={0}
                  aria-haspopup="menu"
                  aria-expanded={openMenuIdx === idx}
                  aria-controls={`account-menu-${user.id}`}
                  onClick={(e) => handleMenuClick(idx, e)}
                  onBlur={(e) => handleBlur(e, idx)}
                  className="size-10 grid place-items-center hover:bg-gray-200 rounded-[8px] text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Ellipsis className="w-5 h-5" />
                </button>
                {/* Dropdown menu with open/close transition */}
                <div
                  id={`account-menu-${user.id}`}
                  tabIndex={-1}
                  className={`
                    absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-[8px] shadow-lg min-w-[7.5rem] z-10 flex flex-col p-1
                    transition-all duration-150
                    ${openMenuIdx === idx && menuTransition[idx]
                      ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
                      : openMenuIdx === idx
                        ? 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                        : 'hidden'
                    }
                  `}
                  style={{ willChange: "opacity, transform" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuTransition((prev) => ({ ...prev, [idx]: false }));
                      setTimeout(() => setOpenMenuIdx(null), 150);
                      onEditUser(user);
                    }}
                    className="text-left w-full px-3 py-2 text-sm rounded-[6px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    Edit
                  </button>
                  {user.username !== "president" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuTransition((prev) => ({ ...prev, [idx]: false }));
                        setTimeout(() => setOpenMenuIdx(null), 150);
                        onDeleteUser(user);
                      }}
                      className="text-left w-full px-3 py-2 text-sm rounded-[6px] text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
