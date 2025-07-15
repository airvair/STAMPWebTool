/**
 * Progress Bar Component
 * Visual indicator for progress tracking
 */

import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  color = 'blue',
  size = 'md',
  showLabel = false,
  animated = true
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      yellow: 'bg-yellow-600',
      red: 'bg-red-600',
      purple: 'bg-purple-600'
    };
    return colors[color];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };
    return sizes[size];
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden
        ${getSizeClasses()}
      `}>
        <div
          className={`
            ${getSizeClasses()} ${getColorClasses()} rounded-full
            ${animated ? 'transition-all duration-300 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default Progress;