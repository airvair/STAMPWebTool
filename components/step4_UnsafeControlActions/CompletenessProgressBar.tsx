import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CompletenessProgressBarProps {
  totalControlActions: number;
  analyzedControlActions: number;
  totalUCATypes: number;
  className?: string;
}

const CompletenessProgressBar: React.FC<CompletenessProgressBarProps> = ({
  totalControlActions,
  analyzedControlActions,
  totalUCATypes,
  className = ''
}) => {
  const totalCells = totalControlActions * totalUCATypes;
  const analyzedCells = analyzedControlActions * totalUCATypes;
  const percentage = totalCells > 0 ? Math.round((analyzedCells / totalCells) * 100) : 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Analysis Completeness</h4>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{percentage}%</span>
      </div>
      
      <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <CheckCircleIcon className="w-3 h-3 text-green-500" />
          <span>{analyzedControlActions} of {totalControlActions} control actions analyzed</span>
        </div>
        <span>{totalCells - analyzedCells} cells remaining</span>
      </div>
    </div>
  );
};

export default CompletenessProgressBar;