import React, { useState } from 'react';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SignalSlashIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/solid';
import { useRobustAnalysis } from '@/hooks/useRobustAnalysis';
import Button from './Button';

interface AnalysisStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

const AnalysisStatusIndicator: React.FC<AnalysisStatusIndicatorProps> = ({ 
  showDetails = false,
  position = 'bottom-right'
}) => {
  const [state, actions] = useRobustAnalysis();
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusIcon = () => {
    switch (state.syncStatus) {
      case 'synced':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'syncing':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'offline':
        return <SignalSlashIcon className="w-5 h-5 text-gray-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (state.syncStatus) {
      case 'synced':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'syncing':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'offline':
        return 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800';
    }
  };

  const getStatusMessage = () => {
    switch (state.syncStatus) {
      case 'synced':
        return 'All changes saved';
      case 'syncing':
        return 'Saving changes...';
      case 'offline':
        return 'Working offline';
      case 'error':
        return 'Sync error occurred';
      default:
        return 'Unknown status';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const criticalErrors = state.errors.filter(e => e.severity === 'critical' || e.severity === 'high');
  const hasUnsavedChanges = state.hasUnsavedChanges;

  if (!showDetails) {
    // Compact indicator
    return (
      <div 
        className={`fixed ${getPositionClasses()} z-40 cursor-pointer`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className={`p-2 rounded-full border shadow-sm ${getStatusColor()} transition-all duration-200 hover:shadow-md`}>
          {getStatusIcon()}
        </div>

        {showDropdown && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                  Analysis Status
                </h4>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {getStatusMessage()}
                  </span>
                </div>

                {hasUnsavedChanges && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    {state.pendingChanges.length} unsaved change(s)
                  </div>
                )}

                {criticalErrors.length > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    {criticalErrors.length} critical error(s)
                  </div>
                )}
              </div>

              {state.syncStatus === 'offline' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    size="sm"
                    onClick={actions.goOnline}
                    leftIcon={<CloudArrowUpIcon className="w-4 h-4" />}
                    disabled={state.operationInProgress}
                  >
                    Try Reconnect
                  </Button>
                </div>
              )}

              {state.syncStatus === 'error' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <Button
                    size="sm"
                    onClick={actions.retryFailedOperations}
                    leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                    disabled={state.operationInProgress}
                  >
                    Retry Failed Operations
                  </Button>
                  
                  {criticalErrors.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={actions.clearAllErrors}
                    >
                      Clear All Errors
                    </Button>
                  )}
                </div>
              )}

              {hasUnsavedChanges && state.isOnline && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <Button
                    size="sm"
                    onClick={actions.forceSave}
                    leftIcon={<CloudArrowUpIcon className="w-4 h-4" />}
                    disabled={state.operationInProgress}
                  >
                    Force Save Now
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={actions.discardUnsavedChanges}
                    disabled={state.operationInProgress}
                  >
                    Discard Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed status panel
  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">
            Analysis Status
          </h4>
        </div>
        
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {getStatusMessage()}
        </div>
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {state.ucas.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">UCAs</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {state.uccas.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">UCCAs</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-semibold ${
            state.pendingChanges.length === 0 ? 
              'text-green-600 dark:text-green-400' : 
              'text-yellow-600 dark:text-yellow-400'
          }`}>
            {state.pendingChanges.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Pending</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-semibold ${
            state.errors.length === 0 ? 
              'text-green-600 dark:text-green-400' : 
              'text-red-600 dark:text-red-400'
          }`}>
            {state.errors.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Errors</div>
        </div>
      </div>

      {/* Last Saved */}
      {state.lastSaved && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Last saved: {state.lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Error List */}
      {criticalErrors.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
            Critical Issues ({criticalErrors.length})
          </h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {criticalErrors.slice(0, 3).map(error => (
              <div 
                key={error.id}
                className="text-sm text-red-700 dark:text-red-300 p-2 bg-red-50 dark:bg-red-900/20 rounded"
              >
                {error.message}
              </div>
            ))}
            {criticalErrors.length > 3 && (
              <div className="text-xs text-red-600 dark:text-red-400">
                ... and {criticalErrors.length - 3} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {state.syncStatus === 'error' && (
          <Button
            size="sm"
            onClick={actions.retryFailedOperations}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            disabled={state.operationInProgress}
          >
            Retry Operations
          </Button>
        )}
        
        {hasUnsavedChanges && state.isOnline && (
          <Button
            size="sm"
            onClick={actions.forceSave}
            leftIcon={<CloudArrowUpIcon className="w-4 h-4" />}
            disabled={state.operationInProgress}
          >
            Save Now
          </Button>
        )}
        
        {state.syncStatus === 'offline' && (
          <Button
            size="sm"
            onClick={actions.goOnline}
            leftIcon={<CloudArrowUpIcon className="w-4 h-4" />}
            disabled={state.operationInProgress}
          >
            Go Online
          </Button>
        )}
        
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            const data = await actions.exportState();
            // Create download
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analysis_export_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          leftIcon={<CloudArrowDownIcon className="w-4 h-4" />}
        >
          Export
        </Button>
      </div>
    </div>
  );
};

export default AnalysisStatusIndicator;