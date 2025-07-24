import React from 'react';

interface MalmquistLogoProps {
  className?: string;
  showText?: boolean;
}

/**
 * Malmquist Safety enterprise logo
 * Modern, minimalist design inspired by Apple, Google, and Microsoft aesthetics
 * Features a geometric shield mark and clean typography
 */
export const MalmquistLogo: React.FC<MalmquistLogoProps> = ({ 
  className = '', 
  showText = true 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Mark - Modern geometric shield */}
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Gradient definition for modern depth */}
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        
        {/* Modern shield shape - cleaner geometry */}
        <path 
          d="M16 3L5 7V17C5 23.5 9.5 27.5 16 30C22.5 27.5 27 23.5 27 17V7L16 3Z" 
          fill="url(#shieldGradient)"
        />
        
        {/* Simplified M letterform - more geometric */}
        <path 
          d="M10 19V13L13.5 16.5L16 14L18.5 16.5L22 13V19" 
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      
      {/* Text Logo - Modern typography */}
      {showText && (
        <div className="flex flex-col -space-y-1">
          <span className="text-xl font-medium text-gray-900 dark:text-white tracking-tight">
            Malmquist
          </span>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 tracking-widest uppercase">
            Safety
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for small spaces
 */
export const MalmquistLogoCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg 
      width="28" 
      height="28" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <defs>
        <linearGradient id="shieldGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path 
        d="M16 3L5 7V17C5 23.5 9.5 27.5 16 30C22.5 27.5 27 23.5 27 17V7L16 3Z" 
        fill="url(#shieldGradientCompact)"
      />
      <path 
        d="M10 19V13L13.5 16.5L16 14L18.5 16.5L22 13V19" 
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};