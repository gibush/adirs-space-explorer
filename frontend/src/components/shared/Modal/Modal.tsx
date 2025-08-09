import React, { useEffect } from 'react';

export interface ModalProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  backdropClassName?: string;
  containerClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  children,
  isOpen = true,
  onClose,
  backdropClassName,
  containerClassName,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${
        backdropClassName ?? ''
      }`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`relative max-h-[90vh] max-w-[100vw] overflow-auto bg-transparent ${
          containerClassName ?? ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;


