
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void; // Optional: if modal can be closed by 'x' or overlay click
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  persistent?: boolean; // If true, clicking overlay or pressing Esc won't close
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', persistent = false }) => {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!persistent && onClose) {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!persistent && event.key === 'Escape' && onClose) {
      onClose();
    }
  };
  
  React.useEffect(() => {
    if (!persistent && onClose) {
      // @ts-ignore
      document.addEventListener('keydown', handleKeyDown);
      // @ts-ignore
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistent, onClose]);


  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-full',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 m-4 overflow-auto w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-xl font-semibold text-slate-800">{title}</h2>
            {!persistent && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
    