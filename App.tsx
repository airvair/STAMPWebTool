import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import StartupModal from './components/step1_Startup/StartupModal';
import CastStep2 from './components/step2_CAST/CastStep2';
import StpaStep2 from './components/step2_STPA/StpaStep2';
import ControlStructureBuilder from './components/step3_ControlStructure/ControlStructureBuilder';
import UnsafeControlActions from './components/step5_UnsafeControlActions/UnsafeControlActions';
import CausalScenarios from './components/step6_CausalScenarios/CausalScenarios';
import RequirementsMitigations from './components/step7_RequirementsMitigations/RequirementsMitigations';
import ReportGenerator from './components/step8_Reporting/ReportGenerator';
import { useAnalysis } from './hooks/useAnalysis';

const App: React.FC = () => {
  const { analysisSession } = useAnalysis();

  return (
      <>
        <Routes>
          <Route path="/" element={<Navigate to="/start" replace />} />
          <Route path="/start" element={<StartupModal />} />
          <Route element={<MainLayout />}>
            <Route path="/cast/step2" element={<CastStep2 />} />
            <Route path="/stpa/step2" element={<StpaStep2 />} />
            <Route path="/analysis/step3" element={<ControlStructureBuilder />} />
            <Route path="/analysis/step5" element={<UnsafeControlActions />} />
            <Route path="/analysis/step6" element={<CausalScenarios />} />
            <Route path="/analysis/step7" element={<RequirementsMitigations />} />
            <Route path="/analysis/step8" element={<ReportGenerator />} />
          </Route>
          {/* Fallback for invalid routes or when analysisType is not set yet */}
          <Route path="*" element={analysisSession?.analysisType ? <Navigate to={analysisSession.currentStep || (analysisSession.analysisType === 'CAST' ? '/cast/step2' : '/stpa/step2')} /> : <div className="p-8 text-center">Loading... or select analysis type.</div>} />
        </Routes>
      </>
  );
};

export default App;