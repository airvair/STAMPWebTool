// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/shared/Select.tsx
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
    containerClassName?: string;
    placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, error, options, className = '', containerClassName = '', placeholder, ...props }) => {
    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <select
                id={id}
                className={`block w-full pl-3 pr-10 py-2 text-base border rounded-lg shadow-sm transition-colors duration-200
                   border-slate-300 dark:border-neutral-700 
                   bg-white dark:bg-neutral-800 
                   text-slate-900 dark:text-slate-200
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-sky-500 
                   disabled:bg-slate-50 dark:disabled:bg-neutral-800/50
                   disabled:text-slate-500 dark:disabled:text-neutral-500
                   ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            >
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map(option => (
                    <option key={option.value} value={option.value} className="dark:bg-neutral-800">{option.label}</option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Select;