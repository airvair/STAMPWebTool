import { AnalysisData } from '@/types/types';

export const exportAnalysisAsJSON = (analysisData: AnalysisData) => {
  // FR-8.2: Export machine-readable JSON
  const dataToExport = {
    analysisSession: analysisData.analysisSession,
    losses: analysisData.losses,
    hazards: analysisData.hazards,
    systemConstraints: analysisData.systemConstraints,
    systemComponents: analysisData.systemComponents,
    controllers: analysisData.controllers,
    controlPaths: analysisData.controlPaths,
    feedbackPaths: analysisData.feedbackPaths,
    controlActions: analysisData.controlActions,
    ucas: analysisData.ucas,
    scenarios: analysisData.scenarios,
    requirements: analysisData.requirements,
    ...(analysisData.analysisSession?.analysisType === 'CAST' && {
      sequenceOfEvents: analysisData.sequenceOfEvents,
    }),
  };

  const jsonString = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${analysisData.analysisSession?.title || 'analysis'}_export.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('JSON export initiated.');
};

export const exportAnalysisAsPDF = () => {
  // FR-8.1: PDF export - This would require a library like jsPDF or a server-side solution.
  alert(
    'PDF export functionality is not yet implemented. This would typically involve generating a document with analysis data, including a traceability matrix and control structure graphic (if available).'
  );
};

export const exportAnalysisAsDOCX = () => {
  // FR-8.1: DOCX export - This would require a library like docx or a server-side solution.
  alert(
    'DOCX export functionality is not yet implemented. Similar to PDF, this would generate a Word document with the analysis results.'
  );
};
