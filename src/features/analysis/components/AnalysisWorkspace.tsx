import React, { useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useNavigation } from '@/context/NavigationContext';
import { useUrlSync } from '@/hooks/useUrlSync';
import { CastStep2 } from '@/features/cast';
import { StpaStep2 } from '@/features/stpa';
import { ControlStructureBuilder } from '@/features/control-structure';
import { UnsafeControlActions } from '@/features/uca';
import { CausalScenarios } from '@/features/causal-scenarios';
import { RequirementsMitigations } from '@/features/requirements';
import { AnalysisType } from '@/types/types';

interface AnalysisWorkspaceProps {
  analysisId?: string;
}

const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = () => {
  const { analysisSession } = useAnalysis();
  const { currentStep, navigateToStep, setAnalysisType, analysisType } = useNavigation();
  
  // Sync URL with project/analysis selection
  useUrlSync();

  // Set analysis type when session changes
  useEffect(() => {
    if (analysisSession?.analysisType) {
      setAnalysisType(analysisSession.analysisType);
    }
  }, [analysisSession?.analysisType, setAnalysisType]);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            navigateToStep('scope');
            break;
          case '2':
            navigateToStep('control-structure');
            break;
          case '3':
            navigateToStep('uca');
            break;
          case '4':
            navigateToStep('scenarios');
            break;
          case '5':
            navigateToStep('requirements');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToStep]);

  if (!analysisSession) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'scope':
        return analysisType === AnalysisType.CAST ? <CastStep2 /> : <StpaStep2 />;
      case 'control-structure':
        return <ControlStructureBuilder />;
      case 'uca':
        return <UnsafeControlActions />;
      case 'scenarios':
        return <CausalScenarios />;
      case 'requirements':
        return <RequirementsMitigations />;
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="h-full">
      {renderStep()}
    </div>
  );
};

export default AnalysisWorkspace;