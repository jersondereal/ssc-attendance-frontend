// Imports
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Checkbox from "../Checkbox/Checkbox";

// Table column and row interfaces
interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: string | number) => React.ReactNode;
}

interface AttendanceRecord {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  status: string;
}

export interface StudentRecord {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
}

export type TableRecord = AttendanceRecord | StudentRecord;

// Table component props
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
  className,
  onActionClick,
  sortConfig,
  onSortChange,
  selectedRows,
  onSelectedRowsChange,
  currentUserRole,
  tableType,
}: TableProps) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const table = tableRef.current;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleScroll = () => setActiveMenu(null);

    document.addEventListener("mousedown", handleClickOutside);
    table?.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      table?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleActionClick = (action: string, row: TableRecord) => {
    onActionClick?.(action, row);
    setActiveMenu(null);
  };

  const isAttendanceRecord = (
    record: TableRecord
  ): record is AttendanceRecord => "status" in record;

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "text-green-700 bg-green-50 border-green-200";
      case "absent":
        return "text-gray-600 bg-gray-100 border-gray-200";
      case "excused":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
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

  const handleMenuClick = (rowIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === rowIndex ? null : rowIndex);
  };

  const showCheckbox = currentUserRole !== "Viewer";
  const showActions = !(
    tableType === "attendance" && currentUserRole === "Viewer"
  );

  // Reorder status column after name
  const getReorderedColumns = (cols: Column[]) => {
    const nameIndex = cols.findIndex((c) => c.key === "name");
    const statusIndex = cols.findIndex((c) => c.key === "status");

    if (nameIndex === -1 || statusIndex === -1) return cols;

    const statusCol = cols[statusIndex];
    const rest = cols.filter((c) => c.key !== "status");

    return [
      ...rest.slice(0, nameIndex + 1),
      statusCol,
      ...rest.slice(nameIndex + 1),
    ];
  };

  const orderedColumns = getReorderedColumns(columns);

  return (
    <div
      ref={tableRef}
      className={`w-full max-w-[70rem] min-h-0 flex-shrink h-[70vh] mx-auto overflow-auto rounded-lg border border-gray-200 pb-32 bg-white shadow-sm relative contain-layout ${
        className ?? ""
      }`}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="bg-gray-50 border-b border-gray-200"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "#F9FAFB", // Tailwind's bg-gray-50
            }}
          >
            <th
              scope="col"
              className="w-10 px-3 py-2 text-left"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                backgroundColor: "#F9FAFB", // Tailwind's bg-gray-50
              }}
            >
              {showCheckbox && (
                <Checkbox
                  checked={
                    data.length > 0 && selectedRows.length === data.length
                  }
                  onChange={(checked) =>
                    onSelectedRowsChange(checked ? data.map((_, i) => i) : [])
                  }
                />
              )}
            </th>
            {orderedColumns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-3 py-2 text-left font-semibold text-gray-700"
                style={{
                  ...(column.width ? { width: column.width } : {}),
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  backgroundColor: "#F9FAFB", // Tailwind's bg-gray-50
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSort(column.key)}
                  className="inline-flex items-center gap-1"
                >
                  {column.label}
                  {sortConfig.key === column.key &&
                    (sortConfig.direction === "asc" ? (
                      <SouthIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <NorthIcon sx={{ fontSize: 16 }} />
                    ))}
                </button>
              </th>
            ))}
            {showActions && (
              <th
                scope="col"
                className="w-10 px-3 py-2"
                aria-label="Actions"
                style={{
                  position: "sticky",
                  top: 0,
                  right: 0,
                  zIndex: 20,
                  backgroundColor: "#F9FAFB",
                  boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.08)",
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={orderedColumns.length + (showActions ? 2 : 1)}
                className="px-4 py-10 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="group border-b border-gray-100 hover:bg-gray-50 h-10"
              >
                <td className="w-10 px-3">
                  {showCheckbox && (
                    <Checkbox
                      checked={selectedRows.includes(rowIndex)}
                      onChange={(checked) =>
                        onSelectedRowsChange(
                          checked
                            ? [...selectedRows, rowIndex]
                            : selectedRows.filter((i) => i !== rowIndex)
                        )
                      }
                    />
                  )}
                </td>
                {orderedColumns.map((column) => (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className="px-3 text-gray-800 truncate"
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.key === "status" && isAttendanceRecord(row) ? (
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusClass(
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
                {showActions && (
                  <td
                    className="w-10 px-3 bg-white group-hover:bg-gray-50"
                    style={{
                      position: "sticky",
                      right: 0,
                      zIndex: activeMenu === rowIndex ? 30 : 1,
                      boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      ref={activeMenu === rowIndex ? menuRef : undefined}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleMenuClick(rowIndex, e)}
                        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                        aria-label="Row actions"
                      >
                        <Ellipsis className="size-5" />
                      </button>
                      {activeMenu === rowIndex && (
                        <div className="absolute right-0 z-[100] mt-1 w-28 rounded-md p-1 flex flex-col gap-1 border border-gray-200 bg-white shadow-lg">
                          {isAttendanceRecord(row) ? (
                            ["Present", "Absent", "Excused"].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() =>
                                  handleActionClick("status", {
                                    ...row,
                                    status,
                                  })
                                }
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-[6px]"
                              >
                                {status}
                              </button>
                            ))
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleActionClick("metrics", row)
                                }
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-[6px]"
                              >
                                Metrics
                              </button>
                              <button
                                type="button"
                                onClick={() => handleActionClick("fines", row)}
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-[6px]"
                              >
                                Fines
                              </button>
                              {currentUserRole !== "Viewer" && (
                                <button
                                  type="button"
                                  onClick={() => handleActionClick("edit", row)}
                                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-[6px]"
                                >
                                  Edit
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
