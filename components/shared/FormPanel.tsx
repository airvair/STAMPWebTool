import React from 'react';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from './Button';

export interface FormPanelProps {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  isEditing?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  disabled?: boolean;
  className?: string;
  showDeleteConfirmation?: boolean;
  deleteConfirmationMessage?: string;
}

const FormPanel: React.FC<FormPanelProps> = ({
  title,
  children,
  onSave,
  onCancel,
  onDelete,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  deleteLabel = 'Delete',
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  disabled = false,
  className = '',
  showDeleteConfirmation = false,
  deleteConfirmationMessage = 'Are you sure you want to delete this item?'
}) => {
  const handleDelete = () => {
    if (!onDelete) return;
    
    if (showDeleteConfirmation) {
      if (window.confirm(deleteConfirmationMessage)) {
        onDelete();
      }
    } else {
      onDelete();
    }
  };

  const handleSave = () => {
    if (!disabled && !isSaving) {
      onSave();
    }
  };

  const handleCancel = () => {
    if (!isSaving && !isDeleting) {
      onCancel();
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
        
        <button
          onClick={handleCancel}
          disabled={isSaving || isDeleting}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {children}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            {onDelete && isEditing && (
              <Button
                onClick={handleDelete}
                variant="secondary"
                leftIcon={<TrashIcon className="w-4 h-4" />}
                disabled={isSaving || isDeleting}
                className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                {isDeleting ? 'Deleting...' : deleteLabel}
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="secondary"
              disabled={isSaving || isDeleting}
            >
              {cancelLabel}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={disabled || isSaving || isDeleting}
            >
              {isSaving ? 'Saving...' : `${saveLabel} ${isEditing ? 'Changes' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPanel;