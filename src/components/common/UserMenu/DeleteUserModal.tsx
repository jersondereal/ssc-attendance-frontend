import { Modal } from "../Modal/Modal";
import type { User } from "./types";

interface DeleteUserModalProps {
  isOpen: boolean;
  selectedUser: User | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteUserModal({
  isOpen,
  selectedUser,
  onConfirm,
  onClose,
}: DeleteUserModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="font-medium mb-4">Delete User?</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete &quot;{selectedUser?.username}&quot;?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-[8px] hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-[8px] hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
