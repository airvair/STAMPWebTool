import React from 'react';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';

export interface CheckboxProps {
  label: string;
  error?: string;
  containerClassName?: string;
  id?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  value?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  error,
  className = '',
  containerClassName = '',
  checked,
  onChange,
  disabled,
}) => {
  return (
    <div className={`mb-2 flex items-start ${containerClassName}`}>
      <div className="flex h-5 items-center">
        <ShadcnCheckbox
          id={id}
          checked={checked}
          onCheckedChange={checkedState => {
            if (onChange) {
              // Create a synthetic event to maintain compatibility with existing onChange handlers
              const syntheticEvent = {
                target: {
                  checked: checkedState === true,
                  id,
                  value: checkedState === true ? 'on' : 'off',
                },
                currentTarget: {
                  checked: checkedState === true,
                  id,
                  value: checkedState === true ? 'on' : 'off',
                },
              } as React.ChangeEvent<HTMLInputElement>;

              onChange(syntheticEvent);
            }
          }}
          disabled={disabled}
          className={className}
        />
      </div>
      <div className="ml-3 text-sm">
        <label
          htmlFor={id}
          className={`font-medium text-slate-700 dark:text-slate-300 ${disabled ? 'opacity-50' : ''} cursor-pointer`}
        >
          {label}
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default Checkbox;
