import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  completenessChecker,
  CompletenessReport,
  CompletenessCheck,
  CheckCategory,
  CheckStatus,
  CheckSeverity,
  CompletnessSuggestion
} from '@/utils/completenessChecker';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { format } from 'date-fns';

const SystematicCompletenessChecker: React.FC = () => {
  const analysisData = useAnalysis();
  const [report, setReport] = useState<CompletenessReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CheckCategory | 'all'>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Run completeness check
  const runCompletenessCheck = async () => {
    setIsChecking(true);
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newReport = completenessChecker.checkCompleteness({
        losses: analysisData.losses || [],
        hazards: analysisData.hazards || [],
        controllers: analysisData.controllers || [],
        controlActions: analysisData.controlActions || [],
        ucas: analysisData.ucas || [],
        uccas: analysisData.uccas || [],
        scenarios: analysisData.causalScenarios || [],
        requirements: analysisData.requirements || []
      });
      
      setReport(newReport);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-run on mount and when data changes significantly
  useEffect(() => {
    const timer = setTimeout(() => {
      runCompletenessCheck();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [
    analysisData.losses?.length,
    analysisData.hazards?.length,
    analysisData.controllers?.length,
    analysisData.controlActions?.length,
    analysisData.ucas?.length,
    analysisData.uccas?.length,
    analysisData.causalScenarios?.length,
    analysisData.requirements?.length
  ]);

  // Filter checks by category
  const filteredChecks = useMemo(() => {
    if (!report) return [];
    if (selectedCategory === 'all') return report.checks;
    return report.checks.filter(check => check.category === selectedCategory);
  }, [report, selectedCategory]);

  // Group checks by category for summary
  const checksByCategory = useMemo(() => {
    if (!report) return new Map();
    
    const grouped = new Map<CheckCategory, CompletenessCheck[]>();
    report.checks.forEach(check => {
      if (!grouped.has(check.category)) {
        grouped.set(check.category, []);
      }
      grouped.get(check.category)!.push(check);
    });
    
    return grouped;
  }, [report]);

  // Calculate category scores
  const categoryScores = useMemo(() => {
    const scores = new Map<CheckCategory, number>();
    
    checksByCategory.forEach((checks, category) => {
      const totalCoverage = checks.reduce((sum, check) => sum + check.coverage, 0);
      scores.set(category, checks.length > 0 ? totalCoverage / checks.length : 0);
    });
    
    return scores;
  }, [checksByCategory]);

  // Export report
  const exportReport = () => {
    if (!report) return;
    
    const content = completenessChecker.exportReport(report);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stpa-completeness-report-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status icon
  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case CheckStatus.COMPLETE:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case CheckStatus.PARTIAL:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case CheckStatus.MISSING:
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case CheckStatus.WARNING:
        return <InformationCircleIcon className="w-5 h-5 text-orange-600" />;
    }
  };

  // Get severity badge color
  const getSeverityColor = (severity: CheckSeverity) => {
    switch (severity) {
      case CheckSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case CheckSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case CheckSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case CheckSeverity.LOW:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case CheckSeverity.INFO:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  // Get priority color for suggestions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return 'text-red-600 dark:text-red-400';
      case 'soon':
        return 'text-orange-600 dark:text-orange-400';
      case 'eventual':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  if (!report && !isChecking) {
    return (
      <div className="text-center py-8">
        <Button onClick={runCompletenessCheck} leftIcon={<ArrowPathIcon className="w-5 h-5" />}>
          Run Completeness Check
        </Button>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-slate-600 dark:text-slate-400">Analyzing completeness...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with overall score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              STPA Completeness Analysis
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Systematic verification of your safety analysis completeness
            </p>
          </div>
          <div className="text-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - report!.overallScore / 100)}`}
                  className={
                    report!.overallScore >= 80
                      ? 'text-green-600'
                      : report!.overallScore >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {report!.overallScore.toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Overall Score</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{
              report!.checks.filter(c => c.status === CheckStatus.COMPLETE).length
            }</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Complete</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{
              report!.checks.filter(c => c.status === CheckStatus.PARTIAL).length
            }</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Partial</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{report!.criticalIssues}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{report!.warnings}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Warnings</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={runCompletenessCheck}
          leftIcon={<ArrowPathIcon className="w-5 h-5" />}
          variant="secondary"
        >
          Refresh Analysis
        </Button>
        <Button
          onClick={() => setShowSuggestions(true)}
          leftIcon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
          variant="secondary"
        >
          View Suggestions ({report!.suggestions.length})
        </Button>
        <Button
          onClick={exportReport}
          leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
          variant="secondary"
        >
          Export Report
        </Button>
      </div>

      {/* Category filter tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedCategory === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            All Checks ({report!.checks.length})
          </button>
          {Array.from(checksByCategory.keys()).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedCategory === category
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{category}</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {categoryScores.get(category)?.toFixed(0)}%
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Check results */}
      <div className="space-y-4">
        {filteredChecks.map(check => (
          <div
            key={check.id}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {check.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(check.severity)}`}>
                      {check.severity}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            check.coverage >= 80
                              ? 'bg-green-600'
                              : check.coverage >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${check.coverage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-right">
                        {check.coverage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  {check.description}
                </p>
                
                {check.details.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Details:
                    </p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                      {check.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-0.5">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {check.recommendations.length > 0 && check.status !== CheckStatus.COMPLETE && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                      Recommendations:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-0.5">
                      {check.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions Modal */}
      <Modal
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        title="Improvement Suggestions"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Prioritized suggestions to improve your STPA analysis completeness:
          </p>
          
          {['immediate', 'soon', 'eventual'].map(priority => {
            const prioritySuggestions = report!.suggestions.filter(s => s.priority === priority);
            if (prioritySuggestions.length === 0) return null;
            
            return (
              <div key={priority}>
                <h4 className={`font-medium mb-2 ${getPriorityColor(priority)}`}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                </h4>
                <div className="space-y-2">
                  {prioritySuggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {suggestion.action}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {suggestion.rationale}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Category: {suggestion.category}
                            </span>
                            <span className={`${
                              suggestion.estimatedImpact === 'high'
                                ? 'text-green-600 dark:text-green-400'
                                : suggestion.estimatedImpact === 'medium'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              Impact: {suggestion.estimatedImpact}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default SystematicCompletenessChecker;