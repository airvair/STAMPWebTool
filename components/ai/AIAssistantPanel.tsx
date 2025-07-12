/**
 * AI Assistant Panel Component
 * Interactive UI for AI-powered STPA analysis assistance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SparklesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  aiAssistant,
  AnalysisInsight,
  InsightCategory,
  AssistantContext,
  AssistantCapability
} from '@/utils/aiAssistant';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Checkbox from '../shared/Checkbox';
import Modal from '../shared/Modal';
import Tooltip from '../shared/Tooltip';

interface AIAssistantPanelProps {
  className?: string;
  onInsightAction?: (insight: AnalysisInsight) => void;
}

interface InsightGroup {
  category: InsightCategory;
  title: string;
  insights: AnalysisInsight[];
  expanded: boolean;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  className = '',
  onInsightAction
}) => {
  const analysisData = useAnalysis();
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AnalysisInsight | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [capabilities, setCapabilities] = useState<AssistantCapability[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<InsightCategory>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-analyze when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeData();
    }, 1000); // Debounce to avoid too frequent analysis

    return () => clearTimeout(timer);
  }, [analysisData]);

  // Load capabilities
  useEffect(() => {
    setCapabilities(aiAssistant.getCapabilities());
  }, []);

  const analyzeData = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const context: AssistantContext = {
        losses: analysisData.losses || [],
        hazards: analysisData.hazards || [],
        controllers: analysisData.controllers || [],
        controlActions: analysisData.controlActions || [],
        ucas: analysisData.ucas || [],
        uccas: analysisData.uccas || [],
        scenarios: analysisData.scenarios || [],
        requirements: analysisData.requirements || []
      };

      const newInsights = await aiAssistant.analyzeAndProvideInsights(context);
      setInsights(newInsights);

      // Auto-expand categories with critical insights
      const criticalCategories = new Set(
        newInsights
          .filter(i => i.severity === 'critical')
          .map(i => i.category)
      );
      setExpandedGroups(prev => new Set([...prev, ...criticalCategories]));

    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analysisData]);

  const groupInsights = useCallback((): InsightGroup[] => {
    const groups = new Map<InsightCategory, AnalysisInsight[]>();
    
    // Filter insights
    let filteredInsights = insights;
    if (filterSeverity !== 'all') {
      filteredInsights = insights.filter(i => i.severity === filterSeverity);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredInsights = filteredInsights.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query)
      );
    }

    // Group by category
    filteredInsights.forEach(insight => {
      if (!groups.has(insight.category)) {
        groups.set(insight.category, []);
      }
      groups.get(insight.category)!.push(insight);
    });

    // Convert to array with titles
    const categoryTitles: Record<InsightCategory, string> = {
      [InsightCategory.MISSING_ELEMENTS]: 'Missing Elements',
      [InsightCategory.INCOMPLETE_ANALYSIS]: 'Incomplete Analysis',
      [InsightCategory.RISK_ASSESSMENT]: 'Risk Assessment',
      [InsightCategory.PATTERN_DETECTION]: 'Pattern Detection',
      [InsightCategory.BEST_PRACTICES]: 'Best Practices',
      [InsightCategory.OPTIMIZATION]: 'Optimization',
      [InsightCategory.CONSISTENCY]: 'Consistency Issues',
      [InsightCategory.COVERAGE]: 'Coverage Analysis'
    };

    return Array.from(groups.entries()).map(([category, insights]) => ({
      category,
      title: categoryTitles[category],
      insights,
      expanded: expandedGroups.has(category)
    }));
  }, [insights, expandedGroups, filterSeverity, searchQuery]);

  const toggleGroup = (category: InsightCategory) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleInsightAction = (insight: AnalysisInsight) => {
    if (insight.actionable) {
      setSelectedInsight(insight);
      if (onInsightAction) {
        onInsightAction(insight);
      }
    }
  };

  const handleCapabilityToggle = (capabilityId: string, enabled: boolean) => {
    aiAssistant.setCapability(capabilityId, enabled);
    setCapabilities(aiAssistant.getCapabilities());
  };

  const getInsightIcon = (insight: AnalysisInsight) => {
    switch (insight.type) {
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'suggestion':
        return <LightBulbIcon className="w-5 h-5 text-blue-600" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-slate-600" />;
      default:
        return <SparklesIcon className="w-5 h-5 text-purple-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  const insightGroups = groupInsights();
  const totalInsights = insights.length;
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const actionableCount = insights.filter(i => i.actionable).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">AI Analysis Assistant</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {totalInsights} insights • {actionableCount} actionable
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={analyzeData}
              size="sm"
              variant="secondary"
              leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </Button>
            
            <Button
              onClick={() => setShowSettings(true)}
              size="sm"
              variant="secondary"
              leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
            >
              Settings
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {totalInsights > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <p className="text-2xl font-semibold text-red-600">{criticalCount}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-orange-600">
                {insights.filter(i => i.severity === 'high').length}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">High</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-yellow-600">
                {insights.filter(i => i.severity === 'medium').length}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">
                {insights.filter(i => i.severity === 'low').length}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Low</p>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </Card>

      {/* Insights */}
      {insightGroups.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-lg font-medium">Great work!</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            No issues or suggestions found in your analysis.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {insightGroups.map(group => (
            <Card key={group.category} className="overflow-hidden">
              <button
                onClick={() => toggleGroup(group.category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {group.expanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="font-medium">{group.title}</span>
                  <span className="text-sm text-slate-500">({group.insights.length})</span>
                </div>
              </button>

              {group.expanded && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {group.insights.map(insight => (
                    <div
                      key={insight.id}
                      className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${
                        insight.actionable ? 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer' : ''
                      }`}
                      onClick={() => insight.actionable && handleInsightAction(insight)}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight)}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(insight.severity)}`}>
                              {insight.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {insight.description}
                          </p>
                          
                          {insight.suggestedAction && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Suggested action:</strong> {insight.suggestedAction}
                              </p>
                            </div>
                          )}
                          
                          {insight.reasoning && insight.reasoning.length > 0 && (
                            <Tooltip content={
                              <div>
                                <p className="font-medium mb-1">Reasoning:</p>
                                <ul className="list-disc list-inside text-xs">
                                  {insight.reasoning.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            }>
                              <button className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                                View reasoning
                              </button>
                            </Tooltip>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            {insight.entityType && (
                              <span>Related to: {insight.entityType}</span>
                            )}
                          </div>
                        </div>

                        {insight.actionable && (
                          <ChevronRightIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="AI Assistant Settings"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Capabilities</h4>
            <div className="space-y-3">
              {capabilities.map(capability => (
                <div key={capability.id} className="flex items-start gap-3">
                  <Checkbox
                    id={capability.id}
                    label=""
                    checked={capability.enabled}
                    onChange={(e) => handleCapabilityToggle(capability.id, e.target.checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={capability.id}
                      className="font-medium text-sm cursor-pointer"
                    >
                      {capability.name}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {capability.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Confidence: {(capability.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-medium mb-2">About AI Assistant</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The AI Assistant analyzes your STPA data in real-time to provide insights,
              detect patterns, and suggest improvements. All analysis is performed locally
              and no data is sent to external servers.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Selected Insight Modal */}
      {selectedInsight && (
        <Modal
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          title="Insight Details"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                {getInsightIcon(selectedInsight)}
                {selectedInsight.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {selectedInsight.description}
              </p>
            </div>

            {selectedInsight.suggestedAction && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Recommended Action
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedInsight.suggestedAction}
                </p>
              </div>
            )}

            {selectedInsight.reasoning && (
              <div>
                <h5 className="font-medium mb-2">Analysis Reasoning</h5>
                <ul className="list-disc list-inside space-y-1">
                  {selectedInsight.reasoning.map((reason, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-slate-500">
                Confidence: {(selectedInsight.confidence * 100).toFixed(0)}%
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedInsight(null)}
                  variant="secondary"
                >
                  Close
                </Button>
                {selectedInsight.entityId && (
                  <Button
                    onClick={() => {
                      // Navigate to entity
                      if (onInsightAction) {
                        onInsightAction(selectedInsight);
                      }
                      setSelectedInsight(null);
                    }}
                  >
                    Go to E
                    ntity
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AIAssistantPanel;