import React, { useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import ControlStructureDiagram from '../ControlStructureDiagram';
import VisualizationControlPanel from '../partials/VisualizationControlPanel';
import { WorkspaceVisualizationState } from './hooks/useWorkspaceState';

interface WorkspaceVisualizationProps {
  visualizationState: WorkspaceVisualizationState;
  onVisualizationStateChange: (newState: Partial<WorkspaceVisualizationState>) => void;
  analysisData: any;
}

const WorkspaceVisualization: React.FC<WorkspaceVisualizationProps> = ({
  visualizationState,
  onVisualizationStateChange
}) => {
  const { analysisSession } = useAnalysis();


  const containerClasses = useMemo(() => {
    const baseClasses = "bg-background flex flex-col h-full";
    
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
        <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium mb-2">No Analysis Session</p>
            <p className="text-sm">Start building your control structure to see the diagram</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 h-full">
        <ControlStructureDiagram showFailurePaths={visualizationState.showFailurePaths} />
      </div>
    );
  };

  const renderControlPanel = () => (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Control Structure Diagram
          </h3>
          {analysisSession && (
            <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs rounded-full">
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