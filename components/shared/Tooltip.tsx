import React, { useState, ReactNode } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    className?: string;
    tooltipClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
                                             children,
                                             content,
                                             className = '',
                                             tooltipClassName = ''
                                         }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span
            className={`relative inline-flex items-center cursor-help rounded bg-sky-100 text-sky-800 px-1 py-0.5 font-semibold align-middle dark:bg-sky-900 dark:text-sky-200 ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
      {children}
            <QuestionMarkCircleIcon className="w-4 h-4 ml-1 opacity-70" />
            {isVisible && (
                <div
                    className={`absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 transform rounded-lg bg-slate-800/90 p-3 text-sm text-white shadow-lg ${tooltipClassName}`}
                >
                    {content}
                    <div className="absolute left-1/2 top-full -translate-x-1/2" style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid rgba(30, 41, 59, 0.9)' // slate-800 with transparency
                    }} />
                </div>
            )}
    </span>
    );
};

export default Tooltip;