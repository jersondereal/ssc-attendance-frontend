import { Button } from "../common/Button/Button";
import { Modal } from "../common/Modal/Modal";

interface BulkAttendanceModalProps {
  isOpen: boolean;
  selectedCount: number;
  status: string;
  confirmChecked: boolean;
  onConfirmCheckedChange: (checked: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function BulkAttendanceModal({
  isOpen,
  selectedCount,
  status,
  confirmChecked,
  onConfirmCheckedChange,
  onConfirm,
  onClose,
}: BulkAttendanceModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5 w-fit">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Confirm bulk attendance update
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          Are you sure you want to mark {selectedCount} selected student
          {selectedCount > 1 ? "s" : ""} as{" "}
          <span className="font-semibold capitalize">{status}</span>?
        </p>

        <div className="flex items-start gap-2 mb-6 p-3 bg-blue-50 border border-blue-200 rounded-[8px]">
          <input
            type="checkbox"
            id="bulk-attendance-confirm"
            checked={confirmChecked}
            onChange={(e) => onConfirmCheckedChange(e.target.checked)}
            className="mt-0.5 h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="bulk-attendance-confirm"
            className="text-xs text-blue-700"
          >
            I understand that this action will update the attendance status for
            {" "}{selectedCount} selected student
            {selectedCount > 1 ? "s" : ""} to{" "}
            <span className="font-semibold capitalize">{status}</span>. I confirm
            that I have verified the selection and take responsibility for this
            action.
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} label="Cancel" variant="secondary" />
          <Button
            onClick={onConfirm}
            className="!bg-blue-500 !text-white !border-blue-500 hover:!bg-blue-600 hover:!border-blue-600 hover:!text-white"
            label={`Mark as ${status}`}
            variant="primary"
            disabled={!confirmChecked}
          />
        </div>
      </div>
    </Modal>
  );
}
