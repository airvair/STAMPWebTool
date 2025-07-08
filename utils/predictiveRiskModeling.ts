/**
 * Predictive Risk Modeling for STPA Analysis
 * Uses historical data and patterns to predict future risks
 */

import {
  UnsafeControlAction,
  UCCA,
  CausalScenario,
  Hazard,
  Controller,
  ControlAction,
  ControllerType
} from '@/types';
import { riskScoringEngine } from './riskScoring';
import { format, differenceInDays, addDays } from 'date-fns';

export interface RiskPrediction {
  id: string;
  entityType: 'uca' | 'scenario' | 'system';
  entityId?: string;
  predictedRiskScore: number;
  currentRiskScore: number;
  riskTrend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: number; // days
  factors: RiskFactor[];
  recommendations: string[];
  predictedDate: Date;
}

export interface RiskFactor {
  name: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
  evidence: string[];
}

export interface RiskTimeSeries {
  date: Date;
  riskScore: number;
  actualScore?: number;
  confidence: number;
}

export interface SystemRiskProfile {
  overallRisk: number;
  riskByCategory: Record<string, number>;
  topRisks: RiskItem[];
  emergingRisks: RiskItem[];
  mitigatedRisks: RiskItem[];
  riskHeatmap: RiskHeatmapCell[][];
}

export interface RiskItem {
  id: string;
  type: string;
  description: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  velocity: number; // Rate of change
}

export interface RiskHeatmapCell {
  likelihood: number;
  severity: number;
  count: number;
  items: string[];
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'timeseries' | 'ensemble';
  accuracy: number;
  features: string[];
  trained: Date;
}

/**
 * Predictive Risk Modeling Engine
 */
export class PredictiveRiskModeling {
  private models = new Map<string, PredictiveModel>();
  private historicalData = new Map<string, RiskTimeSeries[]>();
  private patterns = new Map<string, RiskPattern>();

  constructor() {
    this.initializeModels();
  }

  /**
   * Predict future risk for an entity
   */
  predictRisk(
    entity: UnsafeControlAction | CausalScenario,
    context: {
      hazards: Hazard[];
      controllers: Controller[];
      controlActions: ControlAction[];
      historicalScores?: Array<{ date: Date; score: number }>;
    },
    timeframe: number = 30 // days
  ): RiskPrediction {
    const currentScore = this.calculateCurrentRiskScore(entity, context);
    const factors = this.analyzeRiskFactors(entity, context);
    const trend = this.analyzeTrend(entity.id, currentScore, context.historicalScores);
    const predictedScore = this.calculatePredictedScore(currentScore, factors, trend, timeframe);
    
    return {
      id: `pred_${entity.id}_${Date.now()}`,
      entityType: 'ucaType' in entity ? 'uca' : 'scenario',
      entityId: entity.id,
      predictedRiskScore: predictedScore,
      currentRiskScore: currentScore,
      riskTrend: trend,
      confidence: this.calculateConfidence(factors, context.historicalScores?.length || 0),
      timeframe,
      factors,
      recommendations: this.generateRecommendations(entity, factors, predictedScore),
      predictedDate: addDays(new Date(), timeframe)
    };
  }

  /**
   * Generate risk predictions for the entire system
   */
  predictSystemRisk(
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[],
    context: {
      hazards: Hazard[];
      controllers: Controller[];
      controlActions: ControlAction[];
    },
    timeframe: number = 30
  ): SystemRiskProfile {
    const predictions = [
      ...ucas.map(uca => this.predictRisk(uca, context, timeframe)),
      ...scenarios.map(scenario => this.predictRisk(scenario, context, timeframe))
    ];

    const overallRisk = this.calculateSystemRisk(predictions);
    const riskByCategory = this.categorizeRisks(predictions, ucas, scenarios);
    const topRisks = this.identifyTopRisks(predictions, ucas, scenarios);
    const emergingRisks = this.identifyEmergingRisks(predictions, ucas, scenarios);
    const mitigatedRisks = this.identifyMitigatedRisks(predictions, ucas, scenarios);
    const riskHeatmap = this.generateRiskHeatmap(ucas, context);

    return {
      overallRisk,
      riskByCategory,
      topRisks,
      emergingRisks,
      mitigatedRisks,
      riskHeatmap
    };
  }

  /**
   * Generate time series predictions
   */
  generateTimeSeriesPrediction(
    entityId: string,
    historicalData: Array<{ date: Date; score: number }>,
    days: number = 90
  ): RiskTimeSeries[] {
    const predictions: RiskTimeSeries[] = [];
    
    // Use simple exponential smoothing for now
    const alpha = 0.3; // Smoothing factor
    let lastValue = historicalData[historicalData.length - 1]?.score || 50;
    let trend = this.calculateTrendValue(historicalData);
    
    for (let i = 1; i <= days; i++) {
      const noise = (Math.random() - 0.5) * 5; // Add some randomness
      const predictedValue = lastValue + trend * i + noise;
      const boundedValue = Math.max(0, Math.min(100, predictedValue));
      
      predictions.push({
        date: addDays(new Date(), i),
        riskScore: boundedValue,
        confidence: Math.max(0.5, 1 - (i / days) * 0.5) // Confidence decreases over time
      });
      
      lastValue = alpha * boundedValue + (1 - alpha) * lastValue;
    }
    
    return predictions;
  }

  /**
   * Identify risk patterns
   */
  identifyPatterns(
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[],
    context: any
  ): RiskPattern[] {
    const patterns: RiskPattern[] = [];

    // Pattern 1: Cascading risks
    const cascadingRisks = this.findCascadingRisks(ucas, scenarios);
    if (cascadingRisks.length > 0) {
      patterns.push({
        id: 'cascading-risks',
        name: 'Cascading Risk Pattern',
        description: 'Multiple related risks that could trigger each other',
        severity: 'high',
        affectedEntities: cascadingRisks,
        recommendations: [
          'Implement isolation mechanisms between related systems',
          'Add monitoring for early detection of cascade triggers'
        ]
      });
    }

    // Pattern 2: Common mode failures
    const commonModeFailures = this.findCommonModeFailures(ucas, context);
    if (commonModeFailures.length > 0) {
      patterns.push({
        id: 'common-mode',
        name: 'Common Mode Failure Pattern',
        description: 'Multiple components could fail from the same cause',
        severity: 'critical',
        affectedEntities: commonModeFailures,
        recommendations: [
          'Diversify component implementations',
          'Add redundancy with different failure modes'
        ]
      });
    }

    // Pattern 3: Temporal clustering
    const temporalClusters = this.findTemporalClusters(ucas);
    if (temporalClusters.length > 0) {
      patterns.push({
        id: 'temporal-clustering',
        name: 'Temporal Risk Clustering',
        description: 'Multiple timing-related risks in close proximity',
        severity: 'medium',
        affectedEntities: temporalClusters,
        recommendations: [
          'Implement timing synchronization mechanisms',
          'Add temporal separation between critical operations'
        ]
      });
    }

    return patterns;
  }

  /**
   * Machine learning-based risk prediction
   */
  async trainPredictiveModel(
    trainingData: {
      features: Record<string, number>[];
      labels: number[];
    },
    modelType: 'regression' | 'classification' = 'regression'
  ): Promise<PredictiveModel> {
    // In a real implementation, this would use TensorFlow.js or similar
    // For now, we'll simulate model training
    
    const modelId = `model_${Date.now()}`;
    const model: PredictiveModel = {
      id: modelId,
      name: `Risk Prediction Model ${modelType}`,
      type: modelType,
      accuracy: 0.85 + Math.random() * 0.1, // Simulated accuracy
      features: Object.keys(trainingData.features[0] || {}),
      trained: new Date()
    };

    this.models.set(modelId, model);
    return model;
  }

  /**
   * Private helper methods
   */
  private calculateCurrentRiskScore(
    entity: UnsafeControlAction | CausalScenario,
    context: any
  ): number {
    if ('ucaType' in entity) {
      // UCA risk score
      const hazards = context.hazards.filter((h: Hazard) => 
        entity.hazardIds.includes(h.id)
      );
      return riskScoringEngine.calculateRiskScore(entity, hazards).score;
    } else {
      // Scenario risk score - aggregate from associated UCAs
      const ucaScores = (entity.ucaIds || []).map(ucaId => {
        // Simplified - would need actual UCA lookup
        return 50 + Math.random() * 30;
      });
      return ucaScores.length > 0 
        ? ucaScores.reduce((a, b) => a + b, 0) / ucaScores.length
        : 50;
    }
  }

  private analyzeRiskFactors(
    entity: any,
    context: any
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Factor 1: Complexity
    const complexity = this.assessComplexity(entity, context);
    factors.push({
      name: 'System Complexity',
      impact: complexity > 0.7 ? 'negative' : 'positive',
      weight: 0.25,
      description: `Complexity level: ${(complexity * 100).toFixed(0)}%`,
      evidence: ['Number of interactions', 'Control dependencies']
    });

    // Factor 2: Historical incidents
    const historicalRisk = this.assessHistoricalRisk(entity, context);
    if (historicalRisk > 0) {
      factors.push({
        name: 'Historical Incidents',
        impact: 'negative',
        weight: 0.3,
        description: `${historicalRisk} similar incidents in the past`,
        evidence: ['Previous failures', 'Industry data']
      });
    }

    // Factor 3: Mitigation effectiveness
    const mitigationScore = this.assessMitigation(entity, context);
    factors.push({
      name: 'Mitigation Measures',
      impact: mitigationScore > 0.5 ? 'positive' : 'negative',
      weight: 0.35,
      description: `Mitigation effectiveness: ${(mitigationScore * 100).toFixed(0)}%`,
      evidence: ['Safety barriers', 'Control measures']
    });

    // Factor 4: Environmental conditions
    const environmental = this.assessEnvironmental(entity, context);
    if (environmental !== 0) {
      factors.push({
        name: 'Environmental Factors',
        impact: environmental > 0 ? 'negative' : 'positive',
        weight: 0.1,
        description: 'External conditions affecting risk',
        evidence: ['Operating environment', 'External dependencies']
      });
    }

    return factors;
  }

  private analyzeTrend(
    entityId: string,
    currentScore: number,
    historicalScores?: Array<{ date: Date; score: number }>
  ): 'increasing' | 'decreasing' | 'stable' {
    if (!historicalScores || historicalScores.length < 2) {
      return 'stable';
    }

    const recentScores = historicalScores.slice(-5);
    const avgRecent = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
    
    if (currentScore > avgRecent + 5) return 'increasing';
    if (currentScore < avgRecent - 5) return 'decreasing';
    return 'stable';
  }

  private calculatePredictedScore(
    currentScore: number,
    factors: RiskFactor[],
    trend: string,
    timeframe: number
  ): number {
    let predictedScore = currentScore;

    // Apply factor influences
    factors.forEach(factor => {
      const influence = factor.weight * (factor.impact === 'positive' ? -1 : 1);
      predictedScore += influence * 10 * (timeframe / 30); // Scale by timeframe
    });

    // Apply trend
    const trendMultiplier = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1.0;
    predictedScore *= trendMultiplier;

    // Bound between 0 and 100
    return Math.max(0, Math.min(100, predictedScore));
  }

  private calculateConfidence(factors: RiskFactor[], dataPoints: number): number {
    const baseConfidence = Math.min(0.9, 0.5 + (dataPoints * 0.02));
    const factorConfidence = factors.reduce((sum, f) => sum + f.weight, 0) / factors.length;
    return baseConfidence * factorConfidence;
  }

  private generateRecommendations(
    entity: any,
    factors: RiskFactor[],
    predictedScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (predictedScore > 70) {
      recommendations.push('Implement immediate risk mitigation measures');
      recommendations.push('Increase monitoring frequency for early warning signs');
    }

    factors.forEach(factor => {
      if (factor.impact === 'negative' && factor.weight > 0.2) {
        switch (factor.name) {
          case 'System Complexity':
            recommendations.push('Consider system simplification or modularization');
            break;
          case 'Historical Incidents':
            recommendations.push('Review and strengthen existing safety barriers');
            break;
          case 'Mitigation Measures':
            recommendations.push('Enhance current mitigation strategies');
            break;
        }
      }
    });

    if ('ucaType' in entity && entity.ucaType === 'Too Early/Late') {
      recommendations.push('Implement timing synchronization mechanisms');
    }

    return recommendations;
  }

  private calculateSystemRisk(predictions: RiskPrediction[]): number {
    if (predictions.length === 0) return 0;
    
    // Weighted average based on confidence
    const weightedSum = predictions.reduce((sum, p) => 
      sum + (p.predictedRiskScore * p.confidence), 0
    );
    const totalWeight = predictions.reduce((sum, p) => sum + p.confidence, 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private categorizeRisks(
    predictions: RiskPrediction[],
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[]
  ): Record<string, number> {
    const categories: Record<string, number> = {
      'Human Error': 0,
      'Technical Failure': 0,
      'Organizational': 0,
      'Environmental': 0,
      'Cyber Security': 0
    };

    predictions.forEach(pred => {
      // Categorize based on entity characteristics
      let category = 'Technical Failure'; // Default
      
      if (pred.entityType === 'uca') {
        const uca = ucas.find(u => u.id === pred.entityId);
        if (uca?.context.toLowerCase().includes('operator')) {
          category = 'Human Error';
        } else if (uca?.context.toLowerCase().includes('cyber')) {
          category = 'Cyber Security';
        }
      }
      
      categories[category] += pred.predictedRiskScore / predictions.length;
    });

    return categories;
  }

  private identifyTopRisks(
    predictions: RiskPrediction[],
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[]
  ): RiskItem[] {
    return predictions
      .sort((a, b) => b.predictedRiskScore - a.predictedRiskScore)
      .slice(0, 5)
      .map(pred => {
        const entity = pred.entityType === 'uca' 
          ? ucas.find(u => u.id === pred.entityId)
          : scenarios.find(s => s.id === pred.entityId);
        
        return {
          id: pred.entityId || '',
          type: pred.entityType,
          description: entity ? ('description' in entity ? entity.description : entity.title) : '',
          score: pred.predictedRiskScore,
          trend: pred.riskTrend === 'increasing' ? 'up' : 
                 pred.riskTrend === 'decreasing' ? 'down' : 'stable',
          velocity: Math.abs(pred.predictedRiskScore - pred.currentRiskScore) / pred.timeframe
        };
      });
  }

  private identifyEmergingRisks(
    predictions: RiskPrediction[],
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[]
  ): RiskItem[] {
    return predictions
      .filter(p => p.riskTrend === 'increasing' && p.predictedRiskScore > p.currentRiskScore + 10)
      .sort((a, b) => (b.predictedRiskScore - b.currentRiskScore) - (a.predictedRiskScore - a.currentRiskScore))
      .slice(0, 3)
      .map(pred => {
        const entity = pred.entityType === 'uca' 
          ? ucas.find(u => u.id === pred.entityId)
          : scenarios.find(s => s.id === pred.entityId);
        
        return {
          id: pred.entityId || '',
          type: pred.entityType,
          description: entity ? ('description' in entity ? entity.description : entity.title) : '',
          score: pred.predictedRiskScore,
          trend: 'up',
          velocity: (pred.predictedRiskScore - pred.currentRiskScore) / pred.timeframe
        };
      });
  }

  private identifyMitigatedRisks(
    predictions: RiskPrediction[],
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[]
  ): RiskItem[] {
    return predictions
      .filter(p => p.riskTrend === 'decreasing' && p.currentRiskScore > p.predictedRiskScore + 10)
      .sort((a, b) => (a.currentRiskScore - a.predictedRiskScore) - (b.currentRiskScore - b.predictedRiskScore))
      .slice(0, 3)
      .map(pred => {
        const entity = pred.entityType === 'uca' 
          ? ucas.find(u => u.id === pred.entityId)
          : scenarios.find(s => s.id === pred.entityId);
        
        return {
          id: pred.entityId || '',
          type: pred.entityType,
          description: entity ? ('description' in entity ? entity.description : entity.title) : '',
          score: pred.predictedRiskScore,
          trend: 'down',
          velocity: (pred.currentRiskScore - pred.predictedRiskScore) / pred.timeframe
        };
      });
  }

  private generateRiskHeatmap(
    ucas: UnsafeControlAction[],
    context: any
  ): RiskHeatmapCell[][] {
    const heatmap: RiskHeatmapCell[][] = [];
    
    // 5x5 matrix (likelihood x severity)
    for (let likelihood = 0; likelihood < 5; likelihood++) {
      heatmap[likelihood] = [];
      for (let severity = 0; severity < 5; severity++) {
        heatmap[likelihood][severity] = {
          likelihood: (likelihood + 1) * 20,
          severity: (severity + 1) * 20,
          count: 0,
          items: []
        };
      }
    }
    
    // Populate with UCAs
    ucas.forEach(uca => {
      const score = this.calculateCurrentRiskScore(uca, context);
      const likelihood = Math.floor((score / 100) * 4);
      const severity = Math.floor(((uca.riskScore || 50) / 100) * 4);
      
      if (heatmap[likelihood] && heatmap[likelihood][severity]) {
        heatmap[likelihood][severity].count++;
        heatmap[likelihood][severity].items.push(uca.id);
      }
    });
    
    return heatmap;
  }

  private assessComplexity(entity: any, context: any): number {
    // Simple complexity assessment based on relationships
    let complexity = 0.5;
    
    if ('hazardIds' in entity) {
      complexity += entity.hazardIds.length * 0.05;
    }
    
    if (context.controllers && context.controllers.length > 10) {
      complexity += 0.1;
    }
    
    return Math.min(1, complexity);
  }

  private assessHistoricalRisk(entity: any, context: any): number {
    // Simulate historical risk assessment
    return Math.floor(Math.random() * 3);
  }

  private assessMitigation(entity: any, context: any): number {
    // Simulate mitigation effectiveness
    return 0.3 + Math.random() * 0.6;
  }

  private assessEnvironmental(entity: any, context: any): number {
    // Simulate environmental factor assessment
    return (Math.random() - 0.5) * 2;
  }

  private calculateTrendValue(data: Array<{ date: Date; score: number }>): number {
    if (data.length < 2) return 0;
    
    // Simple linear trend
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.score, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.score, 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private findCascadingRisks(
    ucas: UnsafeControlAction[],
    scenarios: CausalScenario[]
  ): string[] {
    // Find UCAs that could trigger other UCAs
    const cascading: string[] = [];
    
    scenarios.forEach(scenario => {
      if (scenario.ucaIds && scenario.ucaIds.length > 2) {
        cascading.push(...scenario.ucaIds);
      }
    });
    
    return [...new Set(cascading)];
  }

  private findCommonModeFailures(
    ucas: UnsafeControlAction[],
    context: any
  ): string[] {
    // Find UCAs with similar contexts that could fail together
    const commonModes: string[] = [];
    const contextGroups = new Map<string, UnsafeControlAction[]>();
    
    ucas.forEach(uca => {
      const key = uca.context.toLowerCase().split(' ').slice(0, 3).join(' ');
      if (!contextGroups.has(key)) {
        contextGroups.set(key, []);
      }
      contextGroups.get(key)!.push(uca);
    });
    
    contextGroups.forEach(group => {
      if (group.length > 2) {
        commonModes.push(...group.map(u => u.id));
      }
    });
    
    return commonModes;
  }

  private findTemporalClusters(ucas: UnsafeControlAction[]): string[] {
    // Find timing-related UCAs that could interact
    const temporal = ucas
      .filter(uca => uca.ucaType === 'Too Early/Late' || uca.ucaType === 'Stopped Too Soon/Applied Too Long')
      .map(uca => uca.id);
    
    return temporal.length > 2 ? temporal : [];
  }

  private initializeModels(): void {
    // Initialize with some default models
    const defaultModel: PredictiveModel = {
      id: 'default-risk-model',
      name: 'Default Risk Prediction Model',
      type: 'ensemble',
      accuracy: 0.82,
      features: ['complexity', 'historical_incidents', 'mitigation_score'],
      trained: new Date()
    };
    
    this.models.set(defaultModel.id, defaultModel);
  }
}

// Risk pattern interface
interface RiskPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedEntities: string[];
  recommendations: string[];
}

// Export singleton instance
export const predictiveRiskModeling = new PredictiveRiskModeling();