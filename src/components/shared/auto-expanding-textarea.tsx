import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  minRows?: number;
  maxRows?: number;
}

const AutoExpandingTextarea: React.FC<AutoExpandingTextareaProps> = ({
  label,
  id,
  error,
  className = '',
  containerClassName = '',
  value,
  onChange,
  minRows = 1,
  maxRows = 10,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';

    // Get computed styles
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24; // Use parseFloat for more accurate line height
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
    const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;

    // Calculate total padding and border
    const extraHeight = paddingTop + paddingBottom + borderTop + borderBottom;

    // Calculate min and max heights
    const minHeight = minRows * lineHeight + extraHeight;
    const maxHeight = maxRows * lineHeight + extraHeight;

    // Get the actual content height
    const scrollHeight = textarea.scrollHeight;

    // Set the new height within bounds
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Add overflow if we've hit max height
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [minRows, maxRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    // Initial adjustment
    adjustHeight();
  }, [adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    }
    adjustHeight();
  };

  return (
    <div className={cn('', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        rows={1}
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'flex w-full rounded-md border bg-white px-3 py-1.5 text-base shadow-xs dark:bg-slate-900/50',
          'transition-[color,box-shadow,height] outline-none focus-visible:ring-[3px]',
          'resize-none overflow-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'leading-normal',
          error ? 'border-red-500 focus-visible:border-red-500' : '',
          className
        )}
        style={{
          minHeight: 'auto',
          height: 'auto',
          lineHeight: '1.5rem',
        }}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default AutoExpandingTextarea;
