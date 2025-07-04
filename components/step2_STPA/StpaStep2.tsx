import React from 'react';
import { AnalysisType } from '@/types';
import { SharedLossesHazardsComponent } from '@/components/step2_STPA';

/**
 * STPA Step 2 component that handles the setup phase for System-Theoretic Process Analysis.
 * 
 * This component reuses the structure from CastStep2 but with STPA specific labels/logic if needed.
 * For now, it's largely identical due to FR-5.3 stating "Identical UI widgets as 5.2 except copy changes".
 * The copy changes are handled within SharedLossesHazardsComponent via analysisType prop.
 * 
 * Previously this file contained a massive 370-line inline component. This has been extracted
 * to SharedLossesHazardsComponent for better maintainability and reusability.
 */
const StpaStep2: React.FC = () => (
  <SharedLossesHazardsComponent analysisType={AnalysisType.STPA} />
);

export default StpaStep2;