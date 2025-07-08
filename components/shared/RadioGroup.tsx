/**
 * Radio Group Component
 * Reusable radio button group with labels and descriptions
 */

import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  name?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  name = 'radio-group',
  className = '',
  orientation = 'vertical'
}) => {
  return (
    <div
      className={`${
        orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3'
      } ${className}`}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 cursor-pointer ${
            option.disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={option.disabled}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
          />
          <div className="flex-1">
            <div className="font-medium text-slate-800 dark:text-slate-100">
              {option.label}
            </div>
            {option.description && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;