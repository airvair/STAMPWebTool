import React, { useState, useRef } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  options: Option[];
  containerClassName?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  id,
  error,
  options,
  className = '',
  containerClassName = '',
  onChange,
  value = '',
  ...props
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const stringValue = typeof value === 'string' || typeof value === 'number' ? value.toString() : '';

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(stringValue.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHighlightIndex(-1);
    setShowOptions(true);
    onChange?.(e);
  };

  const handleSelect = (option: Option) => {
    const event = {
      ...(
        typeof Event === 'function' ? new Event('change', { bubbles: true }) : { }
      ),
      target: { value: option.value.toString() } as HTMLInputElement,
    } as React.ChangeEvent<HTMLInputElement>;
    onChange?.(event);
    setShowOptions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showOptions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => (i + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => (i - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightIndex]);
      }
    }
  };

  return (
    <div className={`mb-4 ${containerClassName} relative`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        value={stringValue}
        onChange={handleChange}
        onFocus={() => setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 100)}
        onKeyDown={handleKeyDown}
        className={`block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md mt-1 max-h-40 overflow-auto text-sm">
          {filteredOptions.map((opt, idx) => (
            <li
              key={opt.value}
              className={`px-3 py-1 cursor-pointer hover:bg-slate-100 ${
                highlightIndex === idx ? 'bg-slate-100' : ''
              }`}
              onMouseDown={e => {
                e.preventDefault();
                handleSelect(opt);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default AutocompleteInput;
