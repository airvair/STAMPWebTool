import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  options: Option[];
  containerClassName?: string;
  onValueChange?: (value: string) => void;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
                                                               label,
                                                               id,
                                                               error,
                                                               options,
                                                               className = '',
                                                               containerClassName = '',
                                                               onChange,
                                                               onValueChange,
                                                               value = '',
                                                               ...props
                                                             }) => {
  const [inputValue, setInputValue] = useState(value);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(inputValue.toString().toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowOptions(true);
    if(onValueChange) onValueChange(e.target.value);
    if(onChange) onChange(e);
  };

  const handleSelect = (option: Option) => {
    setInputValue(option.label); // Show label in input
    if (onValueChange) onValueChange(option.value.toString()); // Pass value back
    setShowOptions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  return (
      <div className={`mb-4 ${containerClassName} relative`} ref={containerRef}>
        {label && (
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {label}
            </label>
        )}
        <input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={handleChange}
            onFocus={() => setShowOptions(true)}
            className={`block w-full px-3 py-2 border rounded-lg shadow-sm
                   border-slate-300 dark:border-neutral-700 
                   bg-white dark:bg-neutral-800 
                   text-slate-900 dark:text-slate-200
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-sky-500
                   ${error ? 'border-red-500' : ''} ${className}`}
            {...props}
        />
        {showOptions && filteredOptions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-md mt-1 max-h-60 overflow-auto text-sm shadow-lg">
              {filteredOptions.map((opt, idx) => (
                  <li
                      key={opt.value}
                      className={`px-3 py-2 cursor-pointer text-slate-700 dark:text-slate-300 ${
                          highlightIndex === idx ? 'bg-sky-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-neutral-700'
                      }`}
                      onMouseDown={() => handleSelect(opt)}
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