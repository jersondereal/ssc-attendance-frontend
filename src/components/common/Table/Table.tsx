import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Checkbox from "../Checkbox/Checkbox";

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: string | number) => React.ReactNode;
}

interface AttendanceRecord {
  studentId: string;
  name: string;
  course: string;
  year: string;
  section: string;
  status: string;
}

export interface StudentRecord {
  studentId: string;
  name: string;
  course: string;
  year: string;
  section: string;
}

export type TableRecord = AttendanceRecord | StudentRecord;

interface TableProps {
  columns: Column[];
  data: TableRecord[];
  className?: string;
  onActionClick?: (action: string, row: TableRecord) => void;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  };
  onSortChange: (config: { key: string; direction: "asc" | "desc" }) => void;
  selectedRows: number[];
  onSelectedRowsChange: (selectedRows: number[]) => void;
  currentUserRole?: string;
  tableType?: "attendance" | "students";
}

export const Table = ({
  columns,
  data,
  className = "",
  onActionClick,
  sortConfig,
  onSortChange,
  selectedRows,
  onSelectedRowsChange,
  currentUserRole,
  tableType,
}: TableProps) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const table = tableRef.current;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleScroll = () => {
      setActiveMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    table?.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      table?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "text-green-600";
      case "absent":
        return "text-gray-400";
      case "excused":
        return "text-orange-400";
      default:
        return "text-gray-700";
    }
  };

  const handleActionClick = (action: string, row: TableRecord) => {
    onActionClick?.(action, row);
    setActiveMenu(null);
  };

  const isAttendanceRecord = (
    record: TableRecord
  ): record is AttendanceRecord => {
    return "status" in record;
  };

  const handleSort = (key: string) => {
    onSortChange({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleMenuClick = (rowIndex: number, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuWidth = 120; // Width of the menu
    const menuHeight = 120; // Approximate height of the menu
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Calculate initial position
    let top = rect.bottom + window.scrollY;
    let left = rect.right + window.scrollX - menuWidth;

    // Check if menu would go off the bottom of the screen
    if (rect.bottom + menuHeight > windowHeight) {
      top = rect.top + window.scrollY - menuHeight; // Position above the button
    }

    // Check if menu would go off the right of the screen
    if (rect.right + menuWidth > windowWidth) {
      left = rect.left + window.scrollX - menuWidth; // Position to the left of the button
    }

    setMenuPosition({ top, left });
    setActiveMenu(activeMenu === rowIndex ? null : rowIndex);
  };

  return (
    <div
      ref={tableRef}
      className={`w-full max-w-[60rem] h-full max-h-[calc(100vh-17rem)] sm:max-h-[calc(100vh-14rem)] md:max-h-[calc(100vh-11.5rem)] lg:max-h-[calc(100vh-11.5rem)] overflow-x-auto overflow-y-auto rounded-md border-gray-300 bg-white mx-auto shadow-sm border ${className}`}
    >
      <table className="w-full min-w-[800px] border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-300 bg-gray-100 relative">
            <th className="w-10 bg-gray-100 px-1.5">
              {currentUserRole !== "Viewer" && (
                <Checkbox
                  checked={selectedRows.length === data.length}
                  onChange={(checked) => {
                    onSelectedRowsChange(
                      checked ? data.map((_, index) => index) : []
                    );
                  }}
                />
              )}
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer whitespace-nowrap  ${
                  column.key === "status" ? "sticky right-10 bg-gray-100" : ""
                }`}
                style={{ width: column.width ? `${column.width}rem` : "auto" }}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {sortConfig.key === column.key &&
                    (sortConfig.direction === "asc" ? (
                      <SouthIcon sx={{ fontSize: "0.8rem" }} />
                    ) : (
                      <NorthIcon sx={{ fontSize: "0.8rem" }} />
                    ))}
                </div>
              </th>
            ))}
            <th className="w-10 sticky right-0 bg-gray-100 top-0"></th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="h-32 text-center text-gray-400 text-sm"
              >
                <div className="max-w-[100vw]">No data available</div>
              </td>
            </tr>
          ) : (
            <>
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-border-light hover:bg-gray-50 group"
                >
                  <td className="bg-white group-hover:bg-gray-50 px-1.5">
                    {currentUserRole !== "Viewer" && (
                      <Checkbox
                        checked={selectedRows.includes(rowIndex)}
                        onChange={(checked) => {
                          if (checked) {
                            onSelectedRowsChange([...selectedRows, rowIndex]);
                          } else {
                            onSelectedRowsChange(
                              selectedRows.filter((index) => index !== rowIndex)
                            );
                          }
                        }}
                      />
                    )}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={`px-4 !py-3 text-black text-xs whitespace-nowrap bg-white group-hover:bg-gray-50${
                        column.key === "status" ? " sticky right-10" : ""
                      }`}
                    >
                      {column.key === "status" && isAttendanceRecord(row) ? (
                        <span
                          className={`px-2 py-1 rounded-md font-medium relative ${getStatusColor(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      ) : (
                        row[column.key as keyof TableRecord]
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-1 sticky right-0 bg-white group-hover:bg-gray-50">
                    <div className="relative">
                      {!(
                        tableType === "attendance" &&
                        currentUserRole === "Viewer"
                      ) && (
                        <button
                          ref={(el) => {
                            buttonRefs.current[rowIndex] = el;
                          }}
                          onClick={(e) =>
                            handleMenuClick(rowIndex, e.currentTarget)
                          }
                          className="p-1 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <Ellipsis size={16} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>

      {activeMenu !== null &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-white border border-border-dark rounded-md shadow-lg py-1 z-50 max-w-[6rem]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {isAttendanceRecord(data[activeMenu]) ? (
              <>
                <button
                  onClick={() => {
                    handleActionClick("status", {
                      ...data[activeMenu],
                      status: "Present",
                    });
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Present
                </button>
                <button
                  onClick={() => {
                    handleActionClick("status", {
                      ...data[activeMenu],
                      status: "Absent",
                    });
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Absent
                </button>
                <button
                  onClick={() => {
                    handleActionClick("status", {
                      ...data[activeMenu],
                      status: "Excused",
                    });
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Excused
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    handleActionClick("metrics", data[activeMenu]);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Metrics
                </button>
                <button
                  onClick={() => {
                    handleActionClick("fines", data[activeMenu]);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Fines
                </button>
                {currentUserRole !== "Viewer" && (
                  <button
                    onClick={() => handleActionClick("edit", data[activeMenu])}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
