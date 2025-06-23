// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/shared/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <input
                id={id}
                className={`block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200
                   border-slate-300 dark:border-neutral-700 
                   bg-white dark:bg-neutral-800 
                   text-slate-900 dark:text-slate-200
                   placeholder-slate-400 dark:placeholder-neutral-500
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-sky-500
                   disabled:bg-slate-50 dark:disabled:bg-neutral-800/50
                   disabled:text-slate-500 dark:disabled:text-neutral-500
                   ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Input;