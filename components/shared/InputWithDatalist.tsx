import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface InputWithDatalistProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  options: Option[];
  containerClassName?: string;
}

const InputWithDatalist: React.FC<InputWithDatalistProps> = ({
  label,
  id,
  error,
  options,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const datalistId = `${id}-list`;
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        list={datalistId}
        className={`block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      <datalist id={datalistId}>
        {options.map((option) => (
          <option key={option.value} value={option.value.toString()}>{option.label}</option>
        ))}
      </datalist>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default InputWithDatalist;
