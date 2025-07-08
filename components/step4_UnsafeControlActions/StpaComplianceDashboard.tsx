import React, { useMemo } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';
import { useAnalysis } from '@/hooks/useAnalysis';
import { 
  generateSystematicAnalysisReport,
  MIT_STPA_STEPS 
} from '@/utils/mitStpaCompliance';
import Button from '../shared/Button';
import SystematicCompletenessChecker from './SystematicCompletenessChecker';

interface StpaComplianceDashboardProps {
  onExportReport?: () => void;
}

const StpaComplianceDashboard: React.FC<StpaComplianceDashboardProps> = ({ onExportReport }) => {
  const { controllers, controlActions, ucas, uccas, hazards } = useAnalysis();

  const analysisReport = useMemo(() => 
    generateSystematicAnalysisReport(controllers, controlActions, ucas, uccas, hazards),
    [controllers, controlActions, ucas, uccas, hazards]
  );

  const getStepIcon = (completed: boolean) => {
    if (completed) {
      return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    }
    return <ClockIcon className="w-6 h-6 text-gray-400" />;
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getComplianceLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            MIT STPA Methodology Compliance
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Systematic analysis following MIT's 4-step STPA process
          </p>
        </div>
        {onExportReport && (
          <Button 
            onClick={onExportReport}
            leftIcon={<DocumentTextIcon className="w-4 h-4" />}
            size="sm"
          >
            Export Report
          </Button>
        )}
      </div>

      {/* Overall Compliance Score */}
      <div className={`p-4 rounded-lg border ${getComplianceColor(analysisReport.summary.overallScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="w-8 h-8" />
            <div>
              <h4 className="font-semibold text-lg">
                Overall Compliance: {analysisReport.summary.overallScore.toFixed(1)}%
              </h4>
              <p className="text-sm">
                {getComplianceLabel(analysisReport.summary.overallScore)} - MIT STPA methodology adherence
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {analysisReport.summary.readyForNextPhase ? '✅' : '⏳'}
            </div>
            <p className="text-xs">
              {analysisReport.summary.readyForNextPhase ? 'Ready for Step 5' : 'Continue Analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* 4-Step Process Progress */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2" />
          MIT STPA 4-Step Process
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MIT_STPA_STEPS.map((step) => {
            const isCompleted = step.id === 1 ? analysisReport.mitStpaCompliance.step1Complete :
                              step.id === 2 ? analysisReport.mitStpaCompliance.step2Complete :
                              step.id === 3 ? analysisReport.mitStpaCompliance.step3Complete :
                              analysisReport.mitStpaCompliance.step4Complete;

            return (
              <div 
                key={step.id}
                className={`p-3 rounded border ${isCompleted ? 
                  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 
                  'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {getStepIcon(isCompleted)}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                      Step {step.id}: {step.name}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Systematic Completeness */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Systematic Completeness Analysis
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analysisReport.systematicCompleteness.actualUCAs}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">UCAs Identified</div>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {analysisReport.systematicCompleteness.totalExpectedUCAs}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Expected UCAs</div>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
            <div className={`text-2xl font-bold ${
              analysisReport.systematicCompleteness.completenessPercentage >= 80 ? 
                'text-green-600 dark:text-green-400' : 
                'text-yellow-600 dark:text-yellow-400'
            }`}>
              {analysisReport.systematicCompleteness.completenessPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Completeness</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              analysisReport.systematicCompleteness.completenessPercentage >= 80 ? 
                'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(100, analysisReport.systematicCompleteness.completenessPercentage)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
          MIT STPA requires systematic coverage of all control actions across 4 UCA types
        </p>
      </div>

      {/* Quality Issues */}
      {analysisReport.systematicCompleteness.qualityIssues.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
            Quality Issues ({analysisReport.systematicCompleteness.qualityIssues.length})
          </h4>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {analysisReport.systematicCompleteness.qualityIssues.slice(0, 10).map((issue, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-sm ${
                  issue.severity === 'high' ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                  issue.severity === 'medium' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                  'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                }`}
              >
                <span className="font-medium">{issue.severity.toUpperCase()}:</span> {issue.issue}
              </div>
            ))}
            {analysisReport.systematicCompleteness.qualityIssues.length > 10 && (
              <p className="text-xs text-slate-500 text-center">
                ... and {analysisReport.systematicCompleteness.qualityIssues.length - 10} more issues
              </p>
            )}
          </div>
        </div>
      )}

      {/* Missing Combinations */}
      {analysisReport.systematicCompleteness.missingCombinations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Missing UCA Combinations ({analysisReport.systematicCompleteness.missingCombinations.length})
          </h4>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {analysisReport.systematicCompleteness.missingCombinations.slice(0, 8).map((missing, index) => (
              <div key={index} className="text-sm text-slate-600 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                {missing.reason}
              </div>
            ))}
            {analysisReport.systematicCompleteness.missingCombinations.length > 8 && (
              <p className="text-xs text-slate-500 text-center">
                ... and {analysisReport.systematicCompleteness.missingCombinations.length - 8} more combinations
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysisReport.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
            MIT STPA Recommendations
          </h4>
          
          <ul className="space-y-2">
            {analysisReport.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Systematic Completeness Checker */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Systematic Completeness Analysis
        </h4>
        <SystematicCompletenessChecker />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {analysisReport.summary.totalUCAs}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Total UCAs</div>
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {analysisReport.summary.totalUCCAs}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Total UCCAs</div>
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {hazards.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Hazards</div>
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
          <div className={`text-lg font-semibold ${
            analysisReport.summary.criticalIssues === 0 ? 
              'text-green-600 dark:text-green-400' : 
              'text-red-600 dark:text-red-400'
          }`}>
            {analysisReport.summary.criticalIssues}
          </div>
          <div className="text-xs te xt-slate-600 dark:text-slate-300">Critical Issues</div>
        </div>
      </div>
    </div>
  );
};

export default StpaComplianceDashboard;