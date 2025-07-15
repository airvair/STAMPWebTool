import React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <ShadcnInput
                id={id}
                className={`${error ? 'border-red-500 focus-visible:border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Input;