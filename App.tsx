import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EnterpriseLayout from './components/layout/EnterpriseLayout';
import CastStep2 from './components/step2_CAST/CastStep2';
import StpaStep2 from './components/step2_STPA/StpaStep2';
import ControlStructureBuilder from './components/step3_ControlStructure/ControlStructureBuilder';
import { UnsafeControlActions } from './components/step4_UnsafeControlActions';
import CausalScenarios from './components/step5_CausalScenarios/CausalScenarios';
import RequirementsMitigations from './components/step6_RequirementsMitigations/RequirementsMitigations';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Main layout - EnterpriseLayout now handles empty state */}
      <Route path="/" element={<EnterpriseLayout />}>
        <Route index element={<Navigate to="/analysis" replace />} />
        <Route path="analysis" element={<div />} /> {/* Empty state handled by layout */}
        <Route path="cast/step2" element={<CastStep2 />} />
        <Route path="stpa/step2" element={<StpaStep2 />} />
        <Route path="analysis/step3" element={<ControlStructureBuilder />} />
        <Route path="analysis/step4" element={<UnsafeControlActions />} />
        <Route path="analysis/step5" element={<CausalScenarios />} />
        <Route path="analysis/step6" element={<RequirementsMitigations />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;