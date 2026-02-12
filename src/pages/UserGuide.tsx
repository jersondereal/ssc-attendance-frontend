import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function UserGuide() {
  const ITEMS = [
    {
      id: "events",
      label: "Events",
      items: [
        { id: "view-events", label: "View Events" },
        { id: "add-event", label: "Add Event" },
        { id: "edit-event", label: "Edit Event" },
        { id: "delete-event", label: "Delete Event" },
      ],
    },
    {
      id: "attendance",
      label: "Attendance",
      items: [{ id: "view-attendance", label: "View Attendance" }],
    },
    {
      id: "students",
      label: "Students",
      items: [
        { id: "view-students", label: "View Students" },
        { id: "add-student", label: "Add Student" },
        { id: "edit-student", label: "Edit Student" },
        { id: "delete-student", label: "Delete Student" },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      items: [{ id: "view-settings", label: "View Settings" }],
    },
  ];

  // Allow multiple expanded at once: Use array of open parent IDs.
  const [openParentIds, setOpenParentIds] = useState<string[]>([ITEMS[0].id]);
  const [selectedItemId, setSelectedItemId] = useState<string>("add-event");

  const handleToggleParent = (id: string) => {
    setOpenParentIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-[70rem] mx-auto px-5 flex flex-row -mt-5 flex-1 min-h-full text-sm">
      <aside className="lg:w-[270px] border-r min-h-full text-zinc-500">
        <nav className="px-5 py-4">
          <ul className="relative list-none">
            {ITEMS.map((item) => (
              <SidebarDropdown
                key={item.id}
                item={item}
                isOpen={openParentIds.includes(item.id)}
                onOpen={() => handleToggleParent(item.id)}
                selectedItemId={selectedItemId}
                setSelectedItemId={setSelectedItemId}
                openParentIds={openParentIds}
                setOpenParentIds={setOpenParentIds}
              />
            ))}
          </ul>
        </nav>
      </aside>
      <div></div>
    </div>
  );
}

// ====================== COMPONENTS ======================

function SidebarDropdown({
  item,
  isOpen,
  onOpen,
  selectedItemId,
  setSelectedItemId,
  setOpenParentIds,
}: {
  item: { id: string; label: string; items: { id: string; label: string }[] };
  isOpen: boolean;
  onOpen: () => void;
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  openParentIds: string[];
  setOpenParentIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  // Determine if any child is selected
  const someChildSelected = item.items.some(child => selectedItemId === child.id);
  // If a child is currently selected in this section and it is being closed, deselect the child
  const handleClick = () => {
    if (isOpen) {
      // closing; check if selected is under this item
      if (someChildSelected) {
        setSelectedItemId("");
      }
    }
    onOpen();
  };

  return (
    <li
      className={`relative flex flex-col w-full select-none cursor-pointer ${
        !someChildSelected && !isOpen ? "text-gray-400" : ""
      }`}
    >
      <button
        type="button"
        className={`flex flex-row items-center w-full py-1.5 hover:text-black transition-all relative ${
          isOpen ? "text-black" : someChildSelected ? "text-black" : "text-gray-400"
        }`}
        onClick={handleClick}
        aria-expanded={isOpen}
      >
        <span className="flex-grow text-left">{item.label}</span>
        <span>
          <ChevronRight
            className={`size-4 transition-all duration-300 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 my-1" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className={`border-l overflow-hidden`}>
          <ul className="list-none">
            {item.items.map((child) => (
              <SidebarDropdownItem
                key={child.id}
                item={child}
                selected={selectedItemId === child.id}
                onClick={() => {
                  setSelectedItemId(child.id);
                  // If this sidebar wasn't open already (should not happen), open it.
                  if (!isOpen) {
                    setOpenParentIds((prev) =>
                      prev.includes(item.id) ? prev : [...prev, item.id]
                    );
                  }
                }}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

function SidebarDropdownItem({
  item,
  selected,
  onClick,
}: {
  item: { id: string; label: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li
      className={`pl-4 py-1.5 hover:text-black transition-all relative cursor-pointer ${
        selected ? "text-black border-l border-black" : "text-zinc-400"
      }`}
      onClick={onClick}
    >
      <div className={`cursor-pointer relative`}>
        <span className="">{item.label}</span>
      </div>
    </li>
  );
}
