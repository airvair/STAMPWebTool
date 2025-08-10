import React from 'react';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  id,
  error,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <ShadcnTextarea
        id={id}
        rows={rows}
        className={`${error ? 'border-red-500 focus-visible:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Textarea;
