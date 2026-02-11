import {
  FormActions,
  LabeledInput,
  SecondaryButton,
  SubmitButton,
} from "../../shared";
import { DropdownSelector } from "../DropdownSelector/DropdownSelector";
import { Modal } from "../Modal/Modal";
import type { User, UserFormData } from "./types";
import { ROLE_OPTIONS } from "./types";
import { useState } from "react";

interface UserFormModalProps {
  isOpen: boolean;
  formData: UserFormData;
  onFormDataChange: (data: UserFormData) => void;
  selectedUser: User | null;
  currentUser: User | null;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  onClose: () => void;
}

export function UserFormModal({
  isOpen,
  formData,
  onFormDataChange,
  selectedUser,
  currentUser,
  onSubmit,
  onClose,
}: UserFormModalProps) {
  const isPresident = selectedUser?.username === "president";
  const canEditPresident = currentUser?.username === "president";

  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordDisabled = isPresident && !canEditPresident;
  const passwordLabel = selectedUser
    ? "Password (leave blank to keep current)"
    : "Password";

  // Handles submit with loading
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-sm font-semibold mb-6">
          {selectedUser ? "Edit User" : "Add New User"}
        </h2>
        <div className="space-y-4">
          <LabeledInput
            label="Username"
            value={formData.username}
            onChange={(username) => onFormDataChange({ ...formData, username })}
            required
            disabled={isPresident}
          />
          <LabeledInput
            label={passwordLabel}
            type="password"
            value={formData.password}
            onChange={(password) => onFormDataChange({ ...formData, password })}
            required={!selectedUser}
            disabled={passwordDisabled}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <DropdownSelector
              value={formData.role}
              onChange={(value) =>
                onFormDataChange({
                  ...formData,
                  role: value as User["role"],
                })
              }
              options={[...ROLE_OPTIONS]}
              placeholder="Select role"
              className={`py-1.5 ${
                isPresident ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isPresident}
            />
          </div>
        </div>
        <FormActions>
          <SecondaryButton onClick={onClose} fullWidth={false} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <SubmitButton loading={isSubmitting} disabled={isSubmitting}>
            {selectedUser ? "Save Changes" : "Add User"}
          </SubmitButton>
        </FormActions>
      </form>
    </Modal>
  );
}
