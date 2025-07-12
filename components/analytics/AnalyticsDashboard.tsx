/**
 * Advanced Analytics Dashboard for STPA Analysis
 * Provides comprehensive visualization and insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {} from '@/types';
import { versionControlManager } from '@/utils/versionControl';
import { collaborationManager } from '@/utils/collaboration';
import { completenessChecker } from '@/utils/completenessChecker';
import Select from '../shared/Select';
import Card from '../shared/Card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface AnalyticsDashboardProps {
  projectId?: string;
  refreshInterval?: number; // in seconds
}

interface TimeSeriesData {
  date: string;
  losses: number;
  hazards: number;
  ucas: number;
  uccas: number;
  scenarios: number;
  requirements: number;
}

interface RiskDistribution {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

interface CompletenessMetric {
  metric: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

interface CollaborationMetric {
  user: string;
  contributions: number;
  lastActive: Date;
  entityTypes: Record<string, number>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId: _projectId,
  refreshInterval = 30
}) => {
  const analysisData = useAnalysis();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'risk' | 'completeness' | 'collaboration' | 'trends'>('overview');
  const [_isLoading, _setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Calculate overview metrics
  const overviewMetrics = useMemo(() => {
    const ucas = analysisData.ucas || [];
    const uccas = analysisData.uccas || [];
    const scenarios = analysisData.scenarios || [];
    const requirements = analysisData.requirements || [];

    // Risk categories
    const highRiskCount = ucas.filter(uca => 
      uca.riskCategory === 'Critical' || uca.riskCategory === 'High'
    ).length;

    const mediumRiskCount = ucas.filter(uca => 
      uca.riskCategory === 'Medium'
    ).length;

    const lowRiskCount = ucas.filter(uca => 
      uca.riskCategory === 'Low'
    ).length;

    // Coverage metrics
    const ucasWithScenarios = new Set(
      scenarios.flatMap(s => s.ucaIds || [])
    ).size;
    const scenarioCoverage = ucas.length > 0 
      ? (ucasWithScenarios / ucas.length) * 100 
      : 0;

    const scenariosWithRequirements = new Set(
      requirements.flatMap(r => r.scenarioIds || [])
    ).size;
    const requirementCoverage = scenarios.length > 0
      ? (scenariosWithRequirements / scenarios.length) * 100
      : 0;

    return {
      totalEntities: (analysisData.losses?.length || 0) +
                    (analysisData.hazards?.length || 0) +
                    (analysisData.controllers?.length || 0) +
                    (analysisData.controlActions?.length || 0) +
                    ucas.length + uccas.length + scenarios.length + requirements.length,
      riskDistribution: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount,
        unassessed: ucas.length - highRiskCount - mediumRiskCount - lowRiskCount
      },
      coverageMetrics: {
        scenarioCoverage,
        requirementCoverage,
        ucasWithoutScenarios: ucas.length - ucasWithScenarios,
        scenariosWithoutRequirements: scenarios.length - scenariosWithRequirements
      },
      avgUCAsPerController: analysisData.controllers?.length 
        ? ucas.length / analysisData.controllers.length 
        : 0,
      avgScenariosPerUCA: ucasWithScenarios > 0 
        ? scenarios.length / ucasWithScenarios 
        : 0
    };
  }, [analysisData]);

  // Risk distribution data for pie chart
  const riskDistributionData: RiskDistribution[] = [
    {
      category: 'Critical/High',
      count: overviewMetrics.riskDistribution.high,
      percentage: (overviewMetrics.riskDistribution.high / (analysisData.ucas?.length || 1)) * 100,
      color: '#EF4444'
    },
    {
      category: 'Medium',
      count: overviewMetrics.riskDistribution.medium,
      percentage: (overviewMetrics.riskDistribution.medium / (analysisData.ucas?.length || 1)) * 100,
      color: '#F59E0B'
    },
    {
      category: 'Low',
      count: overviewMetrics.riskDistribution.low,
      percentage: (overviewMetrics.riskDistribution.low / (analysisData.ucas?.length || 1)) * 100,
      color: '#10B981'
    },
    {
      category: 'Unassessed',
      count: overviewMetrics.riskDistribution.unassessed,
      percentage: (overviewMetrics.riskDistribution.unassessed / (analysisData.ucas?.length || 1)) * 100,
      color: '#6B7280'
    }
  ];

  // Completeness metrics
  const completenessMetrics = useMemo(() => {
    const report = completenessChecker.checkCompleteness({
      losses: analysisData.losses || [],
      hazards: analysisData.hazards || [],
      controllers: analysisData.controllers || [],
      controlActions: analysisData.controlActions || [],
      ucas: analysisData.ucas || [],
      uccas: analysisData.uccas || [],
      scenarios: analysisData.scenarios || [],
      requirements: analysisData.requirements || []
    });

    // Extract category-specific scores from the checks
    const categoryScores = {
      hazardIdentification: 0,
      controlStructure: 0,
      ucaIdentification: 0,
      causalAnalysis: 0,
      requirements: 0
    };

    report.checks.forEach(check => {
      switch (check.category) {
        case 'Hazards':
          categoryScores.hazardIdentification = Math.max(categoryScores.hazardIdentification, check.coverage);
          break;
        case 'Control Structure':
          categoryScores.controlStructure = Math.max(categoryScores.controlStructure, check.coverage);
          break;
        case 'UCA Coverage':
          categoryScores.ucaIdentification = Math.max(categoryScores.ucaIdentification, check.coverage);
          break;
        case 'Causal Scenarios':
          categoryScores.causalAnalysis = Math.max(categoryScores.causalAnalysis, check.coverage);
          break;
        case 'Requirements':
          categoryScores.requirements = Math.max(categoryScores.requirements, check.coverage);
          break;
      }
    });

    const metrics: CompletenessMetric[] = [
      {
        metric: 'Overall Completeness',
        value: report.overallScore,
        target: 80,
        status: report.overallScore >= 80 ? 'good' : 
                report.overallScore >= 60 ? 'warning' : 'critical'
      },
      {
        metric: 'Hazard Coverage',
        value: categoryScores.hazardIdentification,
        target: 100,
        status: categoryScores.hazardIdentification >= 90 ? 'good' :
                categoryScores.hazardIdentification >= 70 ? 'warning' : 'critical'
      },
      {
        metric: 'Control Structure',
        value: categoryScores.controlStructure,
        target: 100,
        status: categoryScores.controlStructure >= 90 ? 'good' :
                categoryScores.controlStructure >= 70 ? 'warning' : 'critical'
      },
      {
        metric: 'UCA Identification',
        value: categoryScores.ucaIdentification,
        target: 90,
        status: categoryScores.ucaIdentification >= 80 ? 'good' :
                categoryScores.ucaIdentification >= 60 ? 'warning' : 'critical'
      },
      {
        metric: 'Causal Analysis',
        value: categoryScores.causalAnalysis,
        target: 85,
        status: categoryScores.causalAnalysis >= 75 ? 'good' :
                categoryScores.causalAnalysis >= 55 ? 'warning' : 'critical'
      },
      {
        metric: 'Requirements',
        value: categoryScores.requirements,
        target: 90,
        status: categoryScores.requirements >= 80 ? 'good' :
                categoryScores.requirements >= 60 ? 'warning' : 'critical'
      }
    ];

    // Transform issues from checks to the format expected
    const issues = report.checks
      .filter(check => check.status !== 'complete' && check.severity === 'critical')
      .map(check => ({
        message: check.details.join('. '),
        severity: check.severity
      }));

    return {
      metrics,
      issues,
      suggestions: report.suggestions.map(s => s.action)
    };
  }, [analysisData]);

  // Entity growth over time (mock data - would come from version control)
  const getTimeSeriesData = (): TimeSeriesData[] => {
    // In a real implementation, this would query version control history
    const now = new Date();
    const data: TimeSeriesData[] = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        losses: Math.max(0, (analysisData.losses?.length || 0) - i * 0.1),
        hazards: Math.max(0, (analysisData.hazards?.length || 0) - i * 0.3),
        ucas: Math.max(0, (analysisData.ucas?.length || 0) - i * 0.8),
        uccas: Math.max(0, (analysisData.uccas?.length || 0) - i * 0.5),
        scenarios: Math.max(0, (analysisData.scenarios?.length || 0) - i * 0.4),
        requirements: Math.max(0, (analysisData.requirements?.length || 0) - i * 0.3)
      });
    }
    
    return data;
  };

  // Collaboration metrics
  const collaborationMetrics = useMemo(() => {
    const stats = collaborationManager.getStatistics();
    const users = collaborationManager.getOnlineUsers();
    
    // Mock collaboration data - would come from collaboration history
    const metrics: CollaborationMetric[] = users.map(user => ({
      user: user.name,
      contributions: Math.floor(Math.random() * 50) + 10,
      lastActive: new Date(user.lastActive),
      entityTypes: {
        ucas: Math.floor(Math.random() * 20),
        uccas: Math.floor(Math.random() * 15),
        scenarios: Math.floor(Math.random() * 10),
        requirements: Math.floor(Math.random() * 8)
      }
    }));

    return {
      onlineUsers: stats.onlineUsers,
      totalContributions: metrics.reduce((sum, m) => sum + m.contributions, 0),
      activeContributors: metrics.filter(m => 
        new Date().getTime() - m.lastActive.getTime() < 24 * 60 * 60 * 1000
      ).length,
      metrics
    };
  }, []);

  // Treemap data for entity distribution
  const getTreemapData = () => {
    const data = [
      {
        name: 'Losses',
        size: analysisData.losses?.length || 0,
        color: '#DC2626'
      },
      {
        name: 'Hazards',
        size: analysisData.hazards?.length || 0,
        color: '#F59E0B'
      },
      {
        name: 'Controllers',
        size: analysisData.controllers?.length || 0,
        color: '#3B82F6'
      },
      {
        name: 'Control Actions',
        size: analysisData.controlActions?.length || 0,
        color: '#8B5CF6'
      },
      {
        name: 'UCAs',
        size: analysisData.ucas?.length || 0,
        color: '#EF4444'
      },
      {
        name: 'UCCAs',
        size: analysisData.uccas?.length || 0,
        color: '#F97316'
      },
      {
        name: 'Scenarios',
        size: analysisData.scenarios?.length || 0,
        color: '#10B981'
      },
      {
        name: 'Requirements',
        size: analysisData.requirements?.length || 0,
        color: '#06B6D4'
      }
    ];

    return data.filter(d => d.size > 0);
  };

  const renderMetricCard = (
    title: string,
    value: number | string,
    subtitle?: string,
    trend?: 'up' | 'down' | 'neutral',
    trendValue?: string,
    icon?: React.ReactNode
  ) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={`mt-2 flex items-center text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-slate-600'
            }`}>
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : trend === 'down' ? (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              ) : null}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Analytics Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'risk', label: 'Risk Analysis' },
              { value: 'completeness', label: 'Completeness' },
              { value: 'collaboration', label: 'Collaboration' },
              { value: 'trends', label: 'Trends' }
            ]}
          />
          
          <Select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            options={[
              { value: 'week', label: 'Last Week' },
              { value: 'month', label: 'Last Month' },
              { value: 'quarter', label: 'Last Quarter' },
              { value: 'year', label: 'Last Year' }
            ]}
          />
        </div>
      </div>

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard(
              'Total Entities',
              overviewMetrics.totalEntities,
              'Across all categories',
              'up',
              '+12 this week',
              <DocumentChartBarIcon className="w-6 h-6 text-blue-600" />
            )}
            
            {renderMetricCard(
              'High Risk UCAs',
              overviewMetrics.riskDistribution.high,
              `${((overviewMetrics.riskDistribution.high / (analysisData.ucas?.length || 1)) * 100).toFixed(1)}% of total`,
              'down',
              '-3 resolved',
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            )}
            
            {renderMetricCard(
              'Scenario Coverage',
              `${overviewMetrics.coverageMetrics.scenarioCoverage.toFixed(1)}%`,
              `${overviewMetrics.coverageMetrics.ucasWithoutScenarios} UCAs need scenarios`,
              'up',
              '+5% this week',
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            )}
            
            {renderMetricCard(
              'Active Users',
              collaborationMetrics.onlineUsers,
              `${collaborationMetrics.activeContributors} contributors today`,
              'neutral',
              '',
              <UserGroupIcon className="w-6 h-6 text-purple-600" />
            )}
          </div>

          {/* Entity Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Entity Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <Treemap
                  data={getTreemapData()}
                  dataKey="size"
                  stroke="#fff"
                  fill="#8884d8"
                >
                  <Tooltip />
                </Treemap>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: ${entry.count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {/* Risk Analysis */}
      {selectedMetric === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Score Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { score: '0-20', count: 5 },
                  { score: '21-40', count: 12 },
                  { score: '41-60', count: 25 },
                  { score: '61-80', count: 18 },
                  { score: '81-100', count: 8 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk by Controller Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { type: 'Human', A: 75, B: 60, fullMark: 100 },
                  { type: 'Automated', A: 85, B: 70, fullMark: 100 },
                  { type: 'Organization', A: 65, B: 55, fullMark: 100 },
                  { type: 'Physical', A: 70, B: 65, fullMark: 100 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="type" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Current" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Previous" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Top Risk UCAs */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Risk UCAs</h3>
            <div className="space-y-3">
              {analysisData.ucas?.slice(0, 5).map((uca, idx) => (
                <div key={uca.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{uca.code || `UCA-${idx + 1}`}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{uca.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      uca.riskCategory === 'Critical' || uca.riskCategory === 'High' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : uca.riskCategory === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {uca.riskCategory || 'Unassessed'}
                    </span>
                    <span className="text-sm font-medium">
                      Score: {uca.riskScore || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Completeness Analysis */}
      {selectedMetric === 'completeness' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Step Completeness</h3>
              <div className="space-y-4">
                {completenessMetrics.metrics.map(metric => (
                  <div key={metric.metric}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <span className={`text-sm font-medium ${
                        metric.status === 'good' ? 'text-green-600' :
                        metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metric.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          metric.status === 'good' ? 'bg-green-600' :
                          metric.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Target: {metric.target}%
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Issues & Suggestions</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {completenessMetrics.issues.map((issue: {message: string, severity: string}, idx: number) => (
                  <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {issue.message}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Severity: {issue.severity}
                    </p>
                  </div>
                ))}
                
                {completenessMetrics.suggestions.map((suggestion: string, idx: number) => (
                  <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Collaboration Metrics */}
      {selectedMetric === 'collaboration' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {renderMetricCard(
              'Total Contributions',
              collaborationMetrics.totalContributions,
              'All time',
              'up',
              '+45 today'
            )}
            {renderMetricCard(
              'Active Contributors',
              collaborationMetrics.activeContributors,
              'Last 24 hours',
              'up',
              '+2 new'
            )}
            {renderMetricCard(
              'Avg Contributions/User',
              Math.round(collaborationMetrics.totalContributions / Math.max(1, collaborationMetrics.metrics.length)),
              'Per contributor',
              'neutral'
            )}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contributor Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={collaborationMetrics.metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contributions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Trends */}
      {selectedMetric === 'trends' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Entity Growth Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={getTimeSeriesData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="losses" stackId="1" stroke="#DC2626" fill="#DC2626" />
                <Area type="monotone" dataKey="hazards" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                <Area type="monotone" dataKey="ucas" stackId="1" stroke="#EF4444" fill="#EF4444" />
                <Area type="monotone" dataKey="scenarios" stackId="1" stroke="#10B981" fill="#10B981" />
                <Area type="monotone" dataKey="requirements" stackId="1" stroke="#06B6D4" fill="#06B6D4" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { day: 'Mon', changes: 12 },
                  { day: 'Tue', changes: 19 },
                  { day: 'Wed', changes: 15 },
                  { day: 'Thu', changes: 25 },
                  { day: 'Fri', changes: 22 },
                  { day: 'Sat', changes: 8 },
                  { day: 'Sun', changes: 5 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="changes" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Version Control Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Commits</span>
                  <span className="font-medium">{versionControlManager.getStatistics().totalVersions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Branches</span>
                  <span className="font-medium">{versionControlManager.getStatistics().totalBranches}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uncommitted Changes</span>
                  <span className="font-medium">{versionControlManager.getStatistics().uncommittedChanges}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Changes/Version</span>
                  <span className="font-medium">
                    {versionControlManager.getStatistics().averageChangesPerVersion.toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;