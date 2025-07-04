
import React from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import Button from '../shared/Button';


const ReportGenerator: React.FC = () => {
  const analysisData = useAnalysis();

  const handleExportJSON = () => {
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
      ...(analysisData.analysisSession?.analysisType === 'CAST' && { sequenceOfEvents: analysisData.sequenceOfEvents }),
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

  const handleExportPDF = () => {
    // FR-8.1: PDF export - This would require a library like jsPDF or a server-side solution.
    alert('PDF export functionality is not yet implemented. This would typically involve generating a document with analysis data, including a traceability matrix and control structure graphic (if available).');
  };

  const handleExportDOCX = () => {
    // FR-8.1: DOCX export - This would require a library like docx or a server-side solution.
    alert('DOCX export functionality is not yet implemented. Similar to PDF, this would generate a Word document with the analysis results.');
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Generate reports and export your analysis data.
        The control structure graphic and traceability matrix would be embedded in PDF/DOCX exports.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={handleExportPDF} size="lg" variant="primary">
          Export as PDF
        </Button>
        <Button onClick={handleExportDOCX} size="lg" variant="primary">
          Export as DOCX
        </Button>
        <Button onClick={handleExportJSON} size="lg" variant="secondary">
          Export as JSON
        </Button>
      </div>

      <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h4 className="text-lg font-semibold text-slate-700 mb-2">Data Summary:</h4>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          <li>Analysis Type: {analysisData.analysisSession?.analysisType || 'N/A'}</li>
          <li>Losses: {analysisData.losses.length}</li>
          <li>Hazards: {analysisData.hazards.length}</li>
          <li>System Constraints: {analysisData.systemConstraints.length}</li>
          <li>System Components: {analysisData.systemComponents.length}</li>
          <li>Controllers: {analysisData.controllers.length}</li>
          <li>Control Actions: {analysisData.controlActions.length}</li>
          <li>Unsafe Control Actions (UCAs): {analysisData.ucas.length}</li>
          <li>Causal Scenarios: {analysisData.scenarios.length}</li>
          <li>{analysisData.analysisSession?.analysisType === 'STPA' ? 'Requirements' : 'Mitigations'}: {analysisData.requirements.length}</li>
          {analysisData.analysisSession?.analysisType === 'CAST' && <li>Sequence of Events: {analysisData.sequenceOfEvents.length}</li>}
        </ul>
      </div>
    </div>
  );
};

export default ReportGenerator;
    