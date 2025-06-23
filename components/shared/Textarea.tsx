import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <textarea
                id={id}
                rows={4}
                className={`block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400 dark:focus:ring-sky-500 dark:focus:border-sky-500 ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Textarea;