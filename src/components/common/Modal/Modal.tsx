import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  modalClassName?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  modalClassName,
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-md shadow-xl w-full max-w-sm ${
          modalClassName || ""
        }`}
      >
        {children}
      </div>
    </div>
  );
};
