/**
 * Switch Component
 * Toggle switch for boolean settings
 */

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  size = 'md'
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-8 h-4',
          thumb: 'w-3 h-3',
          translate: checked ? 'translate-x-4' : 'translate-x-0.5'
        };
      case 'lg':
        return {
          container: 'w-14 h-7',
          thumb: 'w-6 h-6',
          translate: checked ? 'translate-x-7' : 'translate-x-0.5'
        };
      default:
        return {
          container: 'w-11 h-6',
          thumb: 'w-5 h-5',
          translate: checked ? 'translate-x-5' : 'translate-x-0.5'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <label className={`inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${sizeClasses.container}
          relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
          focus:ring-offset-2 focus:ring-blue-500
          ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            ${sizeClasses.thumb}
            ${sizeClasses.translate}
            pointer-events-none inline-block rounded-full bg-white shadow-lg 
            transform ring-0 transition-transform duration-200 ease-in-out
          `}
        />
      </button>
      {label && (
        <span className={`ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Switch;