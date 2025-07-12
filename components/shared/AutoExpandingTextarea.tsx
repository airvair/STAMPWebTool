import React, { useRef, useEffect, useState } from 'react';

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
    minRows = 1,
    maxRows = 10,
    value,
    onChange,
    ...props 
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hiddenDivRef = useRef<HTMLDivElement>(null);
    const [rows, setRows] = useState(minRows);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        const hiddenDiv = hiddenDivRef.current;
        
        if (textarea && hiddenDiv) {
            // Copy textarea content to hidden div, add a space to ensure proper measurement
            hiddenDiv.textContent = String(value || '') + ' ';
            
            // Get computed styles from the actual textarea
            const computedStyle = window.getComputedStyle(textarea);
            
            // Apply all relevant styles to ensure accurate measurement
            hiddenDiv.style.cssText = `
                position: absolute;
                visibility: hidden;
                white-space: pre-wrap;
                word-wrap: break-word;
                overflow-wrap: break-word;
                width: ${textarea.clientWidth}px;
                font-family: ${computedStyle.fontFamily};
                font-size: ${computedStyle.fontSize};
                font-weight: ${computedStyle.fontWeight};
                line-height: ${computedStyle.lineHeight};
                letter-spacing: ${computedStyle.letterSpacing};
                padding: ${computedStyle.padding};
                border: ${computedStyle.border};
                box-sizing: border-box;
            `;
            
            // Force browser to recalculate
            hiddenDiv.offsetHeight;
            
            // Get the actual line height from the computed style
            const lineHeight = parseFloat(computedStyle.lineHeight) || 
                             parseFloat(computedStyle.fontSize) * 1.5;
            
            // Calculate rows needed based on the scroll height
            const scrollHeight = hiddenDiv.scrollHeight;
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
            const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
            const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
            
            // Calculate content height without padding and border
            const contentHeight = scrollHeight - paddingTop - paddingBottom - borderTop - borderBottom;
            
            // Calculate number of rows, using floor to avoid premature expansion
            const calculatedRows = Math.max(1, Math.floor(contentHeight / lineHeight + 0.1));
            const newRows = Math.min(Math.max(calculatedRows, minRows), maxRows);
            
            setRows(newRows);
        }
    };

    // Adjust height on mount and when value changes
    useEffect(() => {
        adjustHeight();
    }, [value]);

    // Handle resize on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e);
        }
        adjustHeight();
    };

    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    id={id}
                    value={value}
                    onChange={handleChange}
                    rows={rows}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200
                       border-slate-300 dark:border-neutral-700 
                       bg-white dark:bg-neutral-800 
                       text-slate-900 dark:text-slate-200
                       placeholder-slate-400 dark:placeholder-neutral-500
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-sky-500
                       disabled:bg-slate-50 dark:disabled:bg-neutral-800/50
                       disabled:text-slate-500 dark:disabled:text-neutral-500
                       resize-none
                       ${rows > maxRows ? 'overflow-y-auto' : 'overflow-hidden'}
                       ${error ? 'border-red-500' : ''} ${className}`}
                    {...props}
                />
                {/* Hidden div for measuring text width */}
                <div
                    ref={hiddenDivRef}
                    aria-hidden="true"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default AutoExpandingTextarea;