import React, { useMemo } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import { useAnalysis } from '@/hooks/useAnalysis';
import { performSystematicCompletenessCheck } from '@/utils/mitStpaCompliance';

interface CompletenessProgressBarProps {
  showDetails?: boolean;
  compact?: boolean;
}

const CompletenessProgressBar: React.FC<CompletenessProgressBarProps> = ({ 
  showDetails = false, 
  compact = false 
}) => {
  const { controllers, controlActions, ucas, hazards } = useAnalysis();

  const completenessData = useMemo(() => 
    performSystematicCompletenessCheck(controllers, controlActions, ucas, hazards),
    [controllers, controlActions, ucas, hazards]
  );

  const getStatusIcon = () => {
    if (completenessData.completenessPercentage >= 90) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    } else if (completenessData.completenessPercentage >= 70) {
      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    } else {
      return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    if (completenessData.completenessPercentage >= 90) {
      return 'text-green-600 dark:text-green-400';
    } else if (completenessData.completenessPercentage >= 70) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getProgressBarColor = () => {
    if (completenessData.completenessPercentage >= 90) {
      return 'bg-green-500';
    } else if (completenessData.completenessPercentage >= 70) {
      return 'bg-yellow-500';
    } else {
      return 'bg-blue-500';
    }
  };

  const getStatusMessage = () => {
    if (completenessData.completenessPercentage >= 90) {
      return 'Systematic analysis complete';
    } else if (completenessData.completenessPercentage >= 70) {
      return 'Good progress, consider reviewing gaps';
    } else if (completenessData.completenessPercentage >= 40) {
      return 'Making progress, continue systematically';
    } else {
      return 'Early stage - follow MIT STPA methodology';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Completeness: {completenessData.completenessPercentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">
              {completenessData.actualUCAs}/{completenessData.totalExpectedUCAs}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(100, completenessData.completenessPercentage)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">
            Systematic Analysis Progress
          </h4>
        </div>
        <div className={`text-right ${getStatusColor()}`}>
          <div className="font-bold text-lg">
            {completenessData.completenessPercentage.toFixed(1)}%
          </div>
          <div className="text-xs">
            {completenessData.actualUCAs} of {completenessData.totalExpectedUCAs}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
          style={{ width: `${Math.min(100, completenessData.completenessPercentage)}%` }}
        />
      </div>

      <p className={`text-sm ${getStatusColor()}`}>
        {getStatusMessage()}
      </p>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {completenessData.missingCombinations.length}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Missing</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {completenessData.qualityIssues.filter(q => q.severity === 'high').length}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">High Issues</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {controllers.length}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Controllers</div>
            </div>
          </div>

          {completenessData.missingCombinations.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Next Recommended: 
              </div>
              <div className="text-yellow-700 dark:text-yellow-300">
                {completenessData.missingCombinations[0]?.reason}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompletenessProgressBar;