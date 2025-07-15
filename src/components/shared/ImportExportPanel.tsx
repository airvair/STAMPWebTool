import React, { useState, useRef } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  importExportManager,
  ExportOptions,
  ImportOptions,
  ImportResult,
  STAPAnalysisData
} from '@/utils/importExport';
import Button from './Button';
import Modal from './Modal';
import Select from './Select';
import Checkbox from './Checkbox';
import Input from './Input';

interface ImportExportPanelProps {
  projectName?: string;
  projectId?: string;
  onImportComplete?: () => void;
}

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  projectName = 'STPA Analysis',
  projectId,
  onImportComplete
}) => {
  const analysisData = useAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Export options
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'stpa-ml'>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [exportVersion, setExportVersion] = useState('1.0.0');

  // Import options
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'stpa-ml'>('json');
  const [validateSchema, setValidateSchema] = useState(true);
  const [mergeWithExisting, setMergeWithExisting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      const data: STAPAnalysisData = {
        metadata: {
          projectName,
          projectId,
          version: exportVersion,
          exportDate: new Date().toISOString()
        },
        losses: analysisData.losses || [],
        hazards: analysisData.hazards || [],
        controllers: analysisData.controllers || [],
        controlActions: analysisData.controlActions || [],
        feedbackPaths: analysisData.feedbackPaths || [],
        controlPaths: analysisData.controlPaths || [],
        communicationPaths: analysisData.communicationPaths || [],
        systemComponents: analysisData.systemComponents || [],
        ucas: analysisData.ucas || [],
        uccas: analysisData.uccas || [],
        causalScenarios: analysisData.scenarios || [],
        requirements: analysisData.requirements || []
      };

      const options: ExportOptions = {
        format: exportFormat,
        includeMetadata,
        prettyPrint,
        version: exportVersion
      };

      const result = importExportManager.export(data, options);
      const filename = importExportManager.generateFilename(projectName, exportFormat);

      if (exportFormat === 'csv') {
        // CSV export returns a Blob (ZIP file)
        const link = document.createElement('a');
        link.href = URL.createObjectURL(result as Blob);
        link.download = filename.replace('.csv', '.zip');
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        // JSON and STPA-ML return strings
        const blob = new Blob([result as string], { 
          type: exportFormat === 'json' ? 'application/json' : 'application/xml' 
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      }

      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const options: ImportOptions = {
        format: importFormat,
        validateSchema,
        mergeWithExisting
      };

      const result = await importExportManager.import(selectedFile, options);
      setImportResult(result);

      if (result.success && result.data) {
        // Import data into the analysis context
        if (!mergeWithExisting) {
          // Clear existing data first
          analysisData.resetAnalysis();
        }

        // Import each entity type
        result.data.losses.forEach(loss => analysisData.addLoss?.(loss));
        result.data.hazards.forEach(hazard => analysisData.addHazard?.(hazard));
        result.data.controllers.forEach(controller => analysisData.addController?.(controller));
        result.data.controlActions.forEach(action => analysisData.addControlAction?.(action));
        result.data.ucas.forEach(uca => analysisData.addUCA?.(uca));
        result.data.uccas.forEach(ucca => analysisData.addUCCA?.(ucca));
        result.data.causalScenarios?.forEach(scenario => analysisData.addScenario?.(scenario));
        result.data.requirements.forEach(req => analysisData.addRequirement?.(req));

        if (onImportComplete) {
          onImportComplete();
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: [],
        statistics: {
          totalItems: 0,
          importedItems: 0,
          skippedItems: 0,
          failedItems: 0
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect format based on file extension
      if (file.name.endsWith('.json')) {
        setImportFormat('json');
      } else if (file.name.endsWith('.xml')) {
        setImportFormat('stpa-ml');
      } else if (file.name.endsWith('.zip')) {
        setImportFormat('csv');
      }
    }
  };

  const getExportStats = () => {
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

  const stats = getExportStats();
  const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="flex gap-3">
        <Button
          onClick={() => setShowExportModal(true)}
          leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
          variant="secondary"
        >
          Export Analysis
        </Button>
        
        <Button
          onClick={() => setShowImportModal(true)}
          leftIcon={<ArrowUpTrayIcon className="w-5 h-5" />}
          variant="secondary"
        >
          Import Analysis
        </Button>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export STPA Analysis"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">
              Export Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Losses: {stats.losses}</div>
              <div>Hazards: {stats.hazards}</div>
              <div>Controllers: {stats.controllers}</div>
              <div>Control Actions: {stats.controlActions}</div>
              <div>UCAs: {stats.ucas}</div>
              <div>UCCAs: {stats.uccas}</div>
              <div>Scenarios: {stats.scenarios}</div>
              <div>Requirements: {stats.requirements}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <strong>Total Items: {totalItems}</strong>
            </div>
          </div>

          <div className="space-y-4">
            <Select
              label="Export Format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              options={[
                { value: 'json', label: 'JSON (Single file, complete data)' },
                { value: 'csv', label: 'CSV (Multiple files in ZIP)' },
                { value: 'stpa-ml', label: 'STPA-ML (XML format)' }
              ]}
            />

            <Input
              label="Version"
              value={exportVersion}
              onChange={(e) => setExportVersion(e.target.value)}
              placeholder="1.0.0"
            />

            <div className="space-y-2">
              <Checkbox
                id="include-metadata"
                label="Include metadata (project info, export date)"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
              
              {exportFormat === 'json' && (
                <Checkbox
                  id="pretty-print"
                  label="Pretty print (formatted JSON)"
                  checked={prettyPrint}
                  onChange={(e) => setPrettyPrint(e.target.checked)}
                />
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Format Information:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li><strong>JSON:</strong> Complete data in a single file, easy to read and process</li>
                  <li><strong>CSV:</strong> Tabular format, one file per entity type, bundled in ZIP</li>
                  <li><strong>STPA-ML:</strong> XML format for interoperability with other STPA tools</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
              disabled={isProcessing || totalItems === 0}
            >
              {isProcessing ? 'Exporting...' : 'Export'}
            </Button>
            <Button
              onClick={() => setShowExportModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportResult(null);
          setSelectedFile(null);
        }}
        title="Import STPA Analysis"
        size="lg"
      >
        <div className="space-y-6">
          {importResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                importResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {importResult.success ? 'Import Successful' : 'Import Failed'}
                    </p>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <p>Total items: {importResult.statistics.totalItems}</p>
                      <p>Imported: {importResult.statistics.importedItems}</p>
                      {importResult.statistics.skippedItems > 0 && (
                        <p>Skipped: {importResult.statistics.skippedItems}</p>
                      )}
                      {importResult.statistics.failedItems > 0 && (
                        <p>Failed: {importResult.statistics.failedItems}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-600 dark:text-red-400">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-yellow-600 dark:text-yellow-400">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setSelectedFile(null);
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.xml,.zip"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <Select
                  label="Import Format"
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value as any)}
                  options={[
                    { value: 'json', label: 'JSON' },
                    { value: 'csv', label: 'CSV (ZIP file)' },
                    { value: 'stpa-ml', label: 'STPA-ML (XML)' }
                  ]}
                />

                <div className="space-y-2">
                  <Checkbox
                    id="validate-schema"
                    label="Validate data schema"
                    checked={validateSchema}
                    onChange={(e) => setValidateSchema(e.target.checked)}
                  />
                  
                  <Checkbox
                    id="merge-existing"
                    label="Merge with existing data (unchecked = replace)"
                    checked={mergeWithExisting}
                    onChange={(e) => setMergeWithExisting(e.target.checked)}
                  />
                </div>
              </div>

              {!mergeWithExisting && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">Warning:</p>
                      <p>Importing will replace all existing analysis data. This cannot be undone.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  leftIcon={<DocumentArrowUpIcon className="w-5 h-5" />}
                  disabled={isProcessing || !selectedFile}
                >
                  {isProcessing ? 'Importing...' : 'Import'}
                </Button>
                <Button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ImportExportPanel;