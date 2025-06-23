// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step3_ControlStructure/partials/ControlStructureVisualization.tsx
import React from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { AnalysisType } from '../../../types';
import CastControlStructureDiagram from '../CastControlStructureDiagram';
import StpaControlStructureDiagram from '../StpaControlStructureDiagram';

const ControlStructureVisualization: React.FC = () => {
    const { analysisSession } = useAnalysis();

    return (
        <div className="h-full w-full">
            {analysisSession?.analysisType === AnalysisType.CAST ? (
                <CastControlStructureDiagram />
            ) : (
                <StpaControlStructureDiagram />
            )}
        </div>
    );
};

export default ControlStructureVisualization;