import React, { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode; // Add footer prop
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  persistent?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md', persistent = false }) => {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!persistent && event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (!persistent && onClose) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, persistent, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!persistent && onClose) {
      onClose();
    }
  };


  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full h-screen', // Use h-screen for full
  };

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
      >
        <div
            className={`bg-neutral-900/80 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10 m-4 w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow flex flex-col max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
        >
          {title && (
              <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10 bg-black/20">
                <h2 id="modal-title" className="text-lg font-semibold text-slate-100">{title}</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200"
                        aria-label="Close modal"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                )}
              </div>
          )}
          <div className="flex-grow p-6 overflow-y-auto">
            {children}
          </div>
          {footer && (
              <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20">
                {footer}
              </div>
          )}
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