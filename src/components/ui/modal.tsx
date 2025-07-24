import React, { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string; // additional classes for modal container
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      tabIndex={-1}
      onClick={onClose}
    >
      <div
        className={`bg-neutral-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative ${className}`}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
          {title && (
            <h2 id="modal-title" className="text-xl font-bold text-gray-100">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div>{children}</div>

        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
