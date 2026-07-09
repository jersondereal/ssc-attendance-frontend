import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  modalClassName?: string;
  sideContent?: React.ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  modalClassName,
  sideContent,
}: ModalProps) => {
  const [show, setShow] = useState(isOpen);
  const [render, setRender] = useState(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalHeight, setModalHeight] = useState<number | null>(null);

  // Measure the main modal box's real height so sideContent can match it
  // exactly — flex "stretch" alone is circular here since the modal box's
  // own height is content-driven, not fixed.
  useLayoutEffect(() => {
    if (!render || !sideContent) return;
    const el = modalRef.current;
    if (!el) return;
    const update = () => setModalHeight(el.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [render, sideContent]);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setTimeout(() => setShow(true), 20);
      // Prevent scrolling behind modal
      document.body.style.overflow = "hidden";
    } else if (show) {
      setShow(false);
      const timeout = setTimeout(() => setRender(false), 200);
      // Restore scrolling
      document.body.style.overflow = "";
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // ESC key closes modal
  useEffect(() => {
    if (!render) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [render, onClose]);

  if (!render) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200 ${
          show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        className={`relative z-10 w-full max-w-sm rounded-lg bg-white shadow-xl overflow-x-hidden transition-all duration-200 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        } ${modalClassName ?? ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>

      {sideContent && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={modalHeight != null ? { height: modalHeight } : undefined}
          className={`relative z-20 ml-4 hidden shrink-0 transition-all duration-200 lg:block ${
            show ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {sideContent}
        </div>
      )}
    </div>,
    document.body // Portal to body
  );
};
