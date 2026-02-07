import { Button } from "../common/Button/Button";
import { Modal } from "../common/Modal/Modal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  selectedCount: number;
  confirmChecked: boolean;
  onConfirmCheckedChange: (checked: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  selectedCount,
  confirmChecked,
  onConfirmCheckedChange,
  onConfirm,
  onClose,
}: DeleteConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-5 w-fit">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Confirm to delete the selected row{selectedCount > 1 ? "s" : ""}
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          Are you sure you want to delete {selectedCount} selected row
          {selectedCount > 1 ? "s" : ""}? <br /> This action cannot be undone.
        </p>

        <div className="flex items-start gap-2 mb-6 p-3 bg-red-50 border border-red-200 rounded-[8px]">
          <input
            type="checkbox"
            id="delete-confirm"
            checked={confirmChecked}
            onChange={(e) => onConfirmCheckedChange(e.target.checked)}
            className="mt-0.5 h-3 w-3 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="delete-confirm" className="text-xs text-red-700">
            I understand that this action will permanently delete {selectedCount}
            selected row{selectedCount > 1 ? "s" : ""} from the database. This
            data cannot be recovered once deleted. I confirm that I have verified
            the selection and take full responsibility for this action.
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} label="Cancel" variant="secondary" />
          <Button
            onClick={onConfirm}
            className="bg-red-400 !text-white !border-red-500 hover:bg-red-500 !hover:border-red-500 !hover:text-white"
            label="Delete"
            variant="danger"
            disabled={!confirmChecked}
          />
        </div>
      </div>
    </Modal>
  );
}
