import React, { useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import ControlStructureDiagram from '../control-structure-diagram';
import VisualizationControlPanel from '../partials/visualization-control-panel';
import { WorkspaceVisualizationState } from './hooks/useWorkspaceState';

interface WorkspaceVisualizationProps {
  visualizationState: WorkspaceVisualizationState;
  onVisualizationStateChange: (newState: Partial<WorkspaceVisualizationState>) => void;
  analysisData: any;
}

const WorkspaceVisualization: React.FC<WorkspaceVisualizationProps> = ({
  visualizationState,
  onVisualizationStateChange,
}) => {
  const { analysisSession } = useAnalysis();

  const containerClasses = useMemo(() => {
    const baseClasses = 'bg-background flex flex-col h-full';

    switch (visualizationState.layout) {
      case 'overlay':
        return `${baseClasses} fixed inset-0 z-50`;
      case 'split':
        return `${baseClasses} w-full`;
      default: // sidebar
        return `${baseClasses} w-full`;
    }
  }, [visualizationState.layout]);

  const renderVisualizationContent = () => {
    if (!analysisSession) {
      return (
        <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="mb-2 text-lg font-medium">No Analysis Session</p>
            <p className="text-sm">Start building your control structure to see the diagram</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex-1">
        <ControlStructureDiagram showFailurePaths={visualizationState.showFailurePaths} />
      </div>
    );
  };

  const renderControlPanel = () => (
    <div className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Control Structure Diagram
          </h3>
          {analysisSession && (
            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              {analysisSession.analysisType}
            </span>
          )}
        </div>
      </div>

      {/* Include existing VisualizationControlPanel functionality */}
      <VisualizationControlPanel
        visualizationState={visualizationState}
        onVisualizationStateChange={onVisualizationStateChange}
      />
    </div>
  );

  return (
    <div className={`${containerClasses} overflow-hidden`}>
      {renderControlPanel()}
      {renderVisualizationContent()}
    </div>
  );
};

export default WorkspaceVisualization;
