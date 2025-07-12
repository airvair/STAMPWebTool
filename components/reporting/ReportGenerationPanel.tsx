/**
 * Report Generation Panel Component
 * UI for generating STPA analysis reports
 */

import React, { useState } from 'react';
import {
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  reportGenerator,
  ReportOptions,
  GeneratedReport
} from '@/utils/reportGenerator';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import Input from '../shared/Input';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Card from '../shared/Card';
import { format } from 'date-fns';

interface ReportGenerationPanelProps {
  projectName?: string;
  projectId?: string;
  onReportGenerated?: (report: GeneratedReport) => void;
}

const ReportGenerationPanel: React.FC<ReportGenerationPanelProps> = ({
  projectName = 'STPA Analysis',
  projectId: _projectId,
  onReportGenerated
}) => {
  const analysisData = useAnalysis();
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report options
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<ReportOptions['format']>('pdf');
  const [reportTitle, setReportTitle] = useState(`${projectName} - STPA Report`);
  const [reportAuthor, setReportAuthor] = useState('');
  const [reportOrganization, setReportOrganization] = useState('');
  const [reportClassification, setReportClassification] = useState('');
  const [reportVersion, setReportVersion] = useState('1.0');
  
  // Content options
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(true);
  const [includeVisualizations, setIncludeVisualizations] = useState(true);
  const [includeAppendices, setIncludeAppendices] = useState(true);
  const [includeVersionHistory, setIncludeVersionHistory] = useState(false);
  const [includeTraceabilityMatrix, setIncludeTraceabilityMatrix] = useState(true);

  // Custom sections
  const [customSections, setCustomSections] = useState<string>('');

  const templates = reportGenerator.getTemplates();

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = reportGenerator.getTemplate(templateId);
      if (template?.defaultOptions) {
        // Apply template defaults
        setIncludeExecutiveSummary(template.defaultOptions.includeExecutiveSummary ?? true);
        setIncludeDetailedAnalysis(template.defaultOptions.includeDetailedAnalysis ?? true);
        setIncludeAppendices(template.defaultOptions.includeAppendices ?? true);
        setIncludeVersionHistory(template.defaultOptions.includeVersionHistory ?? false);
        setIncludeTraceabilityMatrix(template.defaultOptions.includeTraceabilityMatrix ?? true);
      }
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const options: ReportOptions = {
        format: reportFormat,
        includeExecutiveSummary,
        includeDetailedAnalysis,
        includeVisualizations,
        includeAppendices,
        includeVersionHistory,
        includeTraceabilityMatrix,
        metadata: {
          title: reportTitle,
          author: reportAuthor,
          organization: reportOrganization,
          classification: reportClassification,
          version: reportVersion
        }
      };

      // Parse custom sections if provided
      if (customSections.trim()) {
        try {
          options.customSections = JSON.parse(customSections);
        } catch (_e) {
          console.warn('Invalid custom sections JSON, skipping');
        }
      }

      const data = {
        losses: analysisData.losses || [],
        hazards: analysisData.hazards || [],
        controllers: analysisData.controllers || [],
        controlActions: analysisData.controlActions || [],
        ucas: analysisData.ucas || [],
        uccas: analysisData.uccas || [],
        scenarios: analysisData.scenarios || [],
        requirements: analysisData.requirements || []
      };

      const report = await reportGenerator.generateReport(data, options);
      setGeneratedReport(report);

      if (onReportGenerated) {
        onReportGenerated(report);
      }

      // Download the report
      downloadReport(report);

    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_STPA_Report_${format(new Date(), 'yyyy-MM-dd')}.${report.format}`;
    
    if (report.content instanceof Blob) {
      const url = URL.createObjectURL(report.content);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([report.content], {
        type: getMimeType(report.format)
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getMimeType = (format: string): string => {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'html':
        return 'text/html';
      case 'markdown':
        return 'text/markdown';
      default:
        return 'text/plain';
    }
  };

  const getAnalysisStats = () => {
    return {
      losses: analysisData.losses?.length || 0,
      hazards: analysisData.hazards?.length || 0,
      controllers: analysisData.controllers?.length || 0,
      controlActions: analysisData.controlActions?.length || 0,
      ucas: analysisData.ucas?.length || 0,
      uccas: analysisData.uccas?.length || 0,
      scenarios: analysisData.scenarios?.length || 0,
      requirements: analysisData.requirements?.length || 0
    };
  };

  const stats = getAnalysisStats();
  const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Report</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Generate a standard STPA report with default settings
            </p>
            <Button
              onClick={() => {
                setReportFormat('pdf');
                handleGenerateReport();
              }}
              leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
              disabled={totalItems === 0}
              className="w-full"
            >
              Generate PDF Report
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Custom Report</h3>
              <Cog6ToothIcon className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Configure report options and content
            </p>
            <Button
              onClick={() => setShowModal(true)}
              leftIcon={<DocumentDuplicateIcon className="w-5 h-5" />}
              variant="secondary"
              disabled={totalItems === 0}
              className="w-full"
            >
              Customize Report
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Templates</h3>
              <ClipboardDocumentListIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Use pre-configured report templates
            </p>
            <Select
              value={selectedTemplate}
              onChange={(e) => {
                handleTemplateChange(e.target.value);
                setShowModal(true);
              }}
              options={[
                { value: '', label: 'Select template...' },
                ...templates.map(t => ({ 
                  value: t.id, 
                  label: t.name 
                }))
              ]}
              disabled={totalItems === 0}
            />
          </Card>
        </div>

        {/* Analysis Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Losses</p>
              <p className="text-2xl font-semibold">{stats.losses}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Hazards</p>
              <p className="text-2xl font-semibold">{stats.hazards}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">UCAs</p>
              <p className="text-2xl font-semibold">{stats.ucas}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Requirements</p>
              <p className="text-2xl font-semibold">{stats.requirements}</p>
            </div>
          </div>
          {totalItems === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No analysis data available. Complete your STPA analysis before generating reports.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Report Configuration Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError(null);
          setGeneratedReport(null);
        }}
        title="Configure Report"
        size="xl"
      >
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {generatedReport && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Report Generated Successfully</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {generatedReport.metadata.wordCount} words • 
                  {generatedReport.metadata.pageCount} pages (estimated)
                </p>
              </div>
            </div>
          )}

          {/* Basic Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Report Title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
              
              <Select
                label="Format"
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as any)}
                options={[
                  { value: 'pdf', label: 'PDF Document' },
                  { value: 'docx', label: 'Word Document (DOCX)' },
                  { value: 'html', label: 'HTML Web Page' },
                  { value: 'markdown', label: 'Markdown' }
                ]}
              />

              <Input
                label="Author"
                value={reportAuthor}
                onChange={(e) => setReportAuthor(e.target.value)}
                placeholder="Your name"
              />

              <Input
                label="Organization"
                value={reportOrganization}
                onChange={(e) => setReportOrganization(e.target.value)}
                placeholder="Organization name"
              />

              <Input
                label="Version"
                value={reportVersion}
                onChange={(e) => setReportVersion(e.target.value)}
                placeholder="1.0"
              />

              <Input
                label="Classification"
                value={reportClassification}
                onChange={(e) => setReportClassification(e.target.value)}
                placeholder="e.g., Confidential"
              />
            </div>
          </div>

          {/* Content Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Content Options</h3>
            <div className="space-y-3">
              <Checkbox
                id="exec-summary"
                label="Include Executive Summary"
                checked={includeExecutiveSummary}
                onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
              />
              
              <Checkbox
                id="detailed-analysis"
                label="Include Detailed Analysis"
                checked={includeDetailedAnalysis}
                onChange={(e) => setIncludeDetailedAnalysis(e.target.checked)}
              />
              
              <Checkbox
                id="visualizations"
                label="Include Visualizations (charts and diagrams)"
                checked={includeVisualizations}
                onChange={(e) => setIncludeVisualizations(e.target.checked)}
              />
              
              <Checkbox
                id="appendices"
                label="Include Appendices (glossary, references)"
                checked={includeAppendices}
                onChange={(e) => setIncludeAppendices(e.target.checked)}
              />
              
              <Checkbox
                id="version-history"
                label="Include Version History"
                checked={includeVersionHistory}
                onChange={(e) => setIncludeVersionHistory(e.target.checked)}
              />
              
              <Checkbox
                id="traceability"
                label="Include Traceability Matrix"
                checked={includeTraceabilityMatrix}
                onChange={(e) => setIncludeTraceabilityMatrix(e.target.checked)}
              />
            </div>
          </div>

          {/* Custom Sections */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Custom Sections (Advanced)</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Add custom sections in JSON format
            </p>
            <Textarea
              value={customSections}
              onChange={(e) => setCustomSections(e.target.value)}
              placeholder='[{"id": "custom-1", "title": "Custom Section", "content": "Your content here", "level": 1}]'
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowModal(false);
                setError(null);
                setGeneratedReport(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleGenerateReport}
              leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReportGenerationPanel;