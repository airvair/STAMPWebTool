import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
    return (
        <div className={`flex items-start mb-2 ${containerClassName}`}>
            <div className="flex items-center h-5">
                <input
                    id={id}
                    type="checkbox"
                    className={`focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-sky-600 dark:ring-offset-slate-800 ${className}`}
                    {...props}
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={id} className="font-medium text-slate-700 dark:text-slate-300">{label}</label>
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        </div>
    );
};

export default Checkbox;