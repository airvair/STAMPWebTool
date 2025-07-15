import React from 'react';
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
    containerClassName?: string;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Select: React.FC<SelectProps> = ({ 
    label, 
    id, 
    error, 
    options, 
    className = '', 
    containerClassName = '', 
    placeholder,
    value,
    onChange,
    disabled,
    ...props 
}) => {
    // Convert value to string since shadcn select expects string values
    const stringValue = value !== undefined ? String(value) : undefined;

    const handleValueChange = (newValue: string) => {
        if (onChange) {
            // Create a synthetic event to maintain compatibility with existing onChange handlers
            const syntheticEvent = {
                target: {
                    value: newValue,
                    id,
                    name: props.name,
                },
                currentTarget: {
                    value: newValue,
                    id,
                    name: props.name,
                }
            } as React.ChangeEvent<HTMLSelectElement>;
            
            onChange(syntheticEvent);
        }
    };

    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <ShadcnSelect 
                value={stringValue} 
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger 
                    id={id}
                    className={`w-full ${error ? 'border-red-500 focus-visible:border-red-500' : ''} ${className}`}
                >
                    <SelectValue placeholder={placeholder || "Select an option..."} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(option => (
                        <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </ShadcnSelect>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default Select;