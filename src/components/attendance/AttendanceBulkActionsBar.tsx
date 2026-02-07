import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Button } from "../common/Button/Button";

interface AttendanceBulkActionsBarProps {
  tableType: "attendance" | "students";
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onExport: () => void;
  onDeleteSelected: () => void;
  onBulkStatus: (status: "Present" | "Absent" | "Excused") => void;
  onToggleSelectAll: () => void;
}

export function AttendanceBulkActionsBar({
  tableType,
  selectedCount,
  totalCount,
  isAllSelected,
  onExport,
  onDeleteSelected,
  onBulkStatus,
  onToggleSelectAll,
}: AttendanceBulkActionsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 ">
      <div className="flex flex-row gap-2">
        <Button
          onClick={onExport}
          variant="primary"
          title="Export Table Data"
          label="Export"
        />
        {tableType === "students" && (
          <Button
            icon={<DeleteOutlineOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
            label={`Delete ${selectedCount} row${selectedCount > 1 ? "s" : ""}`}
            variant="danger"
            onClick={onDeleteSelected}
          />
        )}

        {tableType === "attendance" && (
          <>
            <Button
              label="Present"
              variant="primary"
              onClick={() => onBulkStatus("Present")}
            />
            <Button
              label="Absent"
              variant="primary"
              onClick={() => onBulkStatus("Absent")}
            />
            <Button
              label="Excused"
              variant="primary"
              onClick={() => onBulkStatus("Excused")}
            />
          </>
        )}
      </div>
      <Button
        label={
          isAllSelected
            ? `All ${totalCount} row${totalCount > 1 ? "s" : ""} in this ${
                tableType === "attendance" ? "attendance" : "table"
              } are selected.`
            : `Select all ${totalCount} row${totalCount > 1 ? "s" : ""}`
        }
        variant="secondary"
        className={isAllSelected ? "!text-blue-600" : ""}
        onClick={onToggleSelectAll}
      />
    </div>
  );
}
