/**
 * Predictive Risk Dashboard Component
 * Visualizes risk predictions and trends
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  predictiveRiskModeling,
  RiskPrediction,
  SystemRiskProfile,
  RiskTimeSeries
} from '@/utils/predictiveRiskModeling';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';
import {
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { format, addDays } from 'date-fns';

interface PredictiveRiskDashboardProps {
  className?: string;
  onRiskSelect?: (risk: RiskPrediction) => void;
}

const PredictiveRiskDashboard: React.FC<PredictiveRiskDashboardProps> = ({
  className = '',
  onRiskSelect
}) => {
  const analysisData = useAnalysis();
  const [timeframe, setTimeframe] = useState(30);
  const [_selectedEntity, _setSelectedEntity] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemProfile, setSystemProfile] = useState<SystemRiskProfile | null>(null);
  const [_predictions, _setPredictions] = useState<RiskPrediction[]>([]);
  const [timeSeries, setTimeSeries] = useState<RiskTimeSeries[]>([]);

  // Generate predictions
  useEffect(() => {
    analyzeFutureRisks();
  }, [analysisData, timeframe]);

  const analyzeFutureRisks = async () => {
    setIsAnalyzing(true);
    
    try {
      const context = {
        hazards: analysisData.hazards || [],
        controllers: analysisData.controllers || [],
        controlActions: analysisData.controlActions || []
      };

      // Generate system-wide predictions
      const profile = predictiveRiskModeling.predictSystemRisk(
        analysisData.ucas || [],
        analysisData.scenarios || [],
        context,
        timeframe
      );
      setSystemProfile(profile);

      // Generate individual predictions
      const ucaPredictions = (analysisData.ucas || []).slice(0, 10).map(uca =>
        predictiveRiskModeling.predictRisk(uca, context, timeframe)
      );
      
      const scenarioPredictions = (analysisData.scenarios || []).slice(0, 5).map(scenario =>
        predictiveRiskModeling.predictRisk(scenario, context, timeframe)
      );

      _setPredictions([...ucaPredictions, ...scenarioPredictions]);

      // Generate time series for selected entity or overall system
      if (_selectedEntity) {
        const historicalData = generateMockHistoricalData();
        const series = predictiveRiskModeling.generateTimeSeriesPrediction(
          _selectedEntity,
          historicalData,
          90
        );
        setTimeSeries(series);
      }

    } catch (error) {
      console.error('Risk analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock historical data generator
  const generateMockHistoricalData = (): { date: Date; score: number }[] => {
    const data: { date: Date; score: number }[] = [];
    const baseScore = 50 + Math.random() * 20;
    
    for (let i = 90; i >= 0; i--) {
      data.push({
        date: addDays(new Date(), -i),
        score: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 10))
      });
    }
    
    return data;
  };

  // Prepare data for visualizations
  const timeSeriesData = useMemo(() => {
    const historical = generateMockHistoricalData();
    const combined = [
      ...historical.map(h => ({
        date: format(h.date, 'MMM d'),
        historical: h.score,
        predicted: null,
        confidence: null
      })),
      ...timeSeries.map(t => ({
        date: format(t.date, 'MMM d'),
        historical: null,
        predicted: t.riskScore,
        confidence: t.confidence * 100
      }))
    ];
    
    return combined;
  }, [timeSeries]);

  const riskCategoryData = useMemo(() => {
    if (!systemProfile) return [];
    
    return Object.entries(systemProfile.riskByCategory).map(([category, score]) => ({
      category,
      current: score,
      predicted: score * (1 + (Math.random() - 0.5) * 0.3)
    }));
  }, [systemProfile]);

  const riskHeatmapData = useMemo(() => {
    if (!systemProfile) return [];
    
    const data: { x: number; y: number; z: number }[] = [];
    systemProfile.riskHeatmap.forEach((row, _i) => {
      row.forEach((cell, _j) => {
        if (cell.count > 0) {
          data.push({
            x: cell.likelihood,
            y: cell.severity,
            z: cell.count
          });
        }
      });
    });
    
    return data;
  }, [systemProfile]);

  const getRiskTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'increasing':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-red-600" />;
      case 'down':
      case 'decreasing':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-green-600" />;
      default:
        return <div className="w-5 h-5 bg-yellow-500 rounded-full" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return '#EF4444'; // Red
    if (score >= 50) return '#F59E0B'; // Orange
    if (score >= 30) return '#FBBf24'; // Yellow
    return '#10B981'; // Green
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-purple-600" />
            Predictive Risk Analysis
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI-powered risk predictions for the next {timeframe} days
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={timeframe.toString()}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            options={[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: '180', label: '6 months' }
            ]}
          />
          
          <Button
            onClick={analyzeFutureRisks}
            leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Risk Overview */}
      {systemProfile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Overall Risk Score
              </p>
              <ChartBarIcon className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold" style={{ color: getRiskColor(systemProfile.overallRisk) }}>
              {systemProfile.overallRisk.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Predicted for +{timeframe} days
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Top Risks
              </p>
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {systemProfile.topRisks.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Require immediate attention
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Emerging Risks
              </p>
              <ArrowTrendingUpIcon className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {systemProfile.emergingRisks.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Increasing in severity
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Mitigated Risks
              </p>
              <ShieldCheckIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {systemProfile.mitigatedRisks.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Successfully reduced
            </p>
          </Card>
        </div>
      )}

      {/* Risk Predictions Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Trend Prediction</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <RechartsTooltip />
              <Legend />
              <ReferenceLine x={format(new Date(), 'MMM d')} stroke="#666" label="Today" />
              <Area
                type="monotone"
                dataKey="historical"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Historical"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.4}
                strokeDasharray="5 5"
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskCategoryData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Radar
                name="Predicted"
                dataKey="predicted"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.4}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Risk Heatmap */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Heatmap (Likelihood vs Severity)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name="Likelihood" 
              domain={[0, 100]}
              label={{ value: 'Likelihood (%)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              dataKey="y" 
              name="Severity" 
              domain={[0, 100]}
              label={{ value: 'Severity (%)', angle: -90, position: 'insideLeft' }}
            />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              name="Risks"
              data={riskHeatmapData}
              fill="#8884d8"
            >
              {riskHeatmapData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getRiskColor((entry.x + entry.y) / 2)}
                  fillOpacity={0.6 + (entry.z / 10)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>Critical Risk</span>
          </div>
        </div>
      </Card>

      {/* Top Risks Table */}
      {systemProfile && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Predictions Detail</h3>
          
          {/* Top Risks */}
          <div className="mb-6">
            <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 mb-3">
              Top Predicted Risks
            </h4>
            <div className="space-y-2">
              {systemProfile.topRisks.map((risk, idx) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => onRiskSelect && onRiskSelect({
                    id: risk.id,
                    entityType: 'system' as const,
                    predictedRiskScore: risk.score,
                    currentRiskScore: risk.score,
                    riskTrend: risk.trend === 'up' ? 'increasing' : risk.trend === 'down' ? 'decreasing' : 'stable',
                    confidence: 0.8,
                    timeframe: 30,
                    factors: [],
                    recommendations: [`Monitor ${risk.description}`, `Review ${risk.type} controls`],
                    predictedDate: new Date()
                  })}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <p className="font-medium">{risk.description}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Type: {risk.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: getRiskColor(risk.score) }}>
                        {risk.score.toFixed(0)}
                      </p>
                      <p className="text-xs text-slate-500">Risk Score</p>
                    </div>
                    {getRiskTrendIcon(risk.trend)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging Risks */}
          {systemProfile.emergingRisks.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 mb-3">
                Emerging Risks
              </h4>
              <div className="space-y-2">
                {systemProfile.emergingRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{risk.description}</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Velocity: +{risk.velocity.toFixed(1)} points/day
                      </p>
                    </div>
                    <ArrowTrendingUpIcon className="w-5 h-5 text-orange-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mitigated Risks */}
          {systemProfile.mitigatedRisks.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 mb-3">
                Successfully Mitigated
              </h4>
              <div className="space-y-2">
                {systemProfile.mitigatedRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{risk.description}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Reduced by {Math.abs(risk.velocity * 30).toFixed(0)} points
                      </p>
                    </div>
                    <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* AI Insights */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">AI Risk Insights</h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>
                  Risk levels are expected to {systemProfile?.overallRisk && systemProfile.overallRisk > 60 ? 'increase' : 'remain stable'} over 
                  the next {timeframe} days based on current patterns.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>
                  {systemProfile?.emergingRisks.length || 0} emerging risks detected that require 
                  proactive mitigation strategies.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>
                  Focus on {systemProfile?.topRisks[0]?.type || 'technical'} risks as they show 
                  the highest predicted impact.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PredictiveRiskDashboard;