import React, { useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useNavigation } from '@/context/NavigationContext';
import { useUrlSync } from '@/hooks/useUrlSync';
import { CastStep2, StpaStep2 } from '@/features/STAMP/step1_scope-losses';
import { ControlStructureBuilder } from '@/features/STAMP/step2_structure-actions';
import { UnsafeControlActions } from '@/features/STAMP/step3_ucas-uccas';
import { CausalScenarios } from '@/features/STAMP/step4_scenarios';
import { RequirementsMitigations } from '@/features/STAMP/step5_mitigations';
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