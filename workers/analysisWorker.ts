/**
 * Analysis Worker
 * Web Worker for heavy STPA computations
 */

import { 
  UnsafeControlAction, 
  CausalScenario,
  Hazard,
  Loss,
  Requirement,
  Controller,
  ControlAction,
  UCAType,
  UCCA
} from '@/types';

// Worker message types
interface WorkerTask {
  id: string;
  type: 'CALCULATE_RISK' | 'ANALYZE_COMPLETENESS' | 'GENERATE_SUGGESTIONS' | 'FIND_PATTERNS';
  data: any;
}

interface WorkerResult {
  id: string;
  result?: any;
  error?: string;
}

// Handle incoming messages
self.onmessage = (event: MessageEvent<WorkerTask>) => {
  const { id, type, data } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'CALCULATE_RISK':
        result = calculateRiskScores(data);
        break;
        
      case 'ANALYZE_COMPLETENESS':
        result = analyzeCompleteness(data);
        break;
        
      case 'GENERATE_SUGGESTIONS':
        result = generateSuggestions(data);
        break;
        
      case 'FIND_PATTERNS':
        result = findPatterns(data);
        break;
        
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    self.postMessage({ id, result } as WorkerResult);
  } catch (error) {
    self.postMessage({ 
      id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    } as WorkerResult);
  }
};

/**
 * Calculate risk scores for UCAs and scenarios
 */
function calculateRiskScores(data: {
  ucas: UnsafeControlAction[];
  scenarios: CausalScenario[];
  hazards: Hazard[];
}) {
  const { ucas, scenarios, hazards } = data;
  const hazardSeverityMap = new Map<string, number>();
  
  // Build hazard severity map
  hazards.forEach(hazard => {
    const severity = typeof hazard.severity === 'number' ? Number(hazard.severity) : 5;
    hazardSeverityMap.set(hazard.id, severity);
  });
  
  // Calculate UCA risk scores
  const ucaScores = ucas.map(uca => {
    let riskScore = 5; // Base score
    
    // Factor in hazard severity
    const linkedHazards = uca.linkedHazards || uca.hazardIds || [];
    if (linkedHazards.length > 0) {
      const hazardSeverities = linkedHazards
        .map(id => hazardSeverityMap.get(id) || 5);
      riskScore = Math.max(...hazardSeverities);
    }
    
    // Factor in UCA type
    const typeMultipliers: Record<UCAType, number> = {
      [UCAType.NotProvided]: 1.2,
      [UCAType.ProvidedUnsafe]: 1.1,
      [UCAType.TooEarly]: 1.3,
      [UCAType.TooLate]: 1.3,
      [UCAType.WrongOrder]: 1.25,
      [UCAType.TooLong]: 1.15,
      [UCAType.TooShort]: 1.15
    };
    
    riskScore *= typeMultipliers[uca.ucaType] || 1;
    
    // Factor in context complexity
    const contextWords = uca.context?.split(' ').length || 0;
    if (contextWords > 20) riskScore *= 1.1;
    if (contextWords > 40) riskScore *= 1.2;
    
    return {
      id: uca.id,
      score: Math.min(10, riskScore)
    };
  });
  
  // Calculate scenario risk scores
  const scenarioScores = scenarios.map(scenario => {
    let riskScore = 5;
    
    // Find related UCA score
    const relatedUCA = ucaScores.find(u => u.id === scenario.ucaId);
    if (relatedUCA) {
      riskScore = relatedUCA.score * 0.8; // Scenarios typically slightly lower risk
    }
    
    // Factor in causal factors
    const factorCount = scenario.causalFactors?.length || 0;
    riskScore *= (1 + factorCount * 0.1);
    
    return {
      id: scenario.id,
      score: Math.min(10, riskScore)
    };
  });
  
  return {
    ucaScores,
    scenarioScores,
    summary: {
      avgUCARisk: ucaScores.reduce((sum, s) => sum + s.score, 0) / ucaScores.length,
      avgScenarioRisk: scenarioScores.reduce((sum, s) => sum + s.score, 0) / scenarioScores.length,
      highRiskUCAs: ucaScores.filter(s => s.score >= 7).length,
      highRiskScenarios: scenarioScores.filter(s => s.score >= 7).length
    }
  };
}

/**
 * Analyze completeness of STPA analysis
 */
function analyzeCompleteness(data: {
  losses: Loss[];
  hazards: Hazard[];
  controllers: Controller[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  scenarios: CausalScenario[];
  requirements: Requirement[];
}) {
  const issues: string[] = [];
  const metrics: Record<string, number> = {};
  
  // Check losses
  metrics.lossCount = data.losses.length;
  if (data.losses.length === 0) {
    issues.push('No losses defined');
  }
  
  // Check hazards
  metrics.hazardCount = data.hazards.length;
  metrics.hazardsPerLoss = data.losses.length > 0 
    ? data.hazards.length / data.losses.length 
    : 0;
    
  const unlinkedHazards = data.hazards.filter(h => {
    const linkedLosses = h.linkedLosses || h.lossIds || h.linkedLossIds || [];
    return linkedLosses.length === 0;
  });
  if (unlinkedHazards.length > 0) {
    issues.push(`${unlinkedHazards.length} hazards not linked to losses`);
  }
  
  // Check control structure
  metrics.controllerCount = data.controllers.length;
  metrics.controlActionCount = data.controlActions.length;
  
  if (data.controllers.length === 0) {
    issues.push('No controllers defined');
  }
  
  // Check UCAs
  metrics.ucaCount = data.ucas.length;
  metrics.ucasPerControlAction = data.controlActions.length > 0
    ? data.ucas.length / data.controlActions.length
    : 0;
    
  // Check UCA type coverage
  const ucaTypes = new Set(data.ucas.map(u => u.ucaType));
  const missingTypes = Object.values(UCAType).filter((t): t is UCAType => !ucaTypes.has(t));
  if (missingTypes.length > 0) {
    issues.push(`Missing UCA types: ${missingTypes.join(', ')}`);
  }
  
  // Check scenarios
  metrics.scenarioCount = data.scenarios.length;
  metrics.scenariosPerUCA = data.ucas.length > 0
    ? data.scenarios.length / data.ucas.length
    : 0;
    
  const unlinkedScenarios = data.scenarios.filter(s => !s.ucaId && (!s.ucaIds || s.ucaIds.length === 0));
  if (unlinkedScenarios.length > 0) {
    issues.push(`${unlinkedScenarios.length} scenarios not linked to UCAs`);
  }
  
  // Check requirements
  metrics.requirementCount = data.requirements.length;
  metrics.requirementsPerScenario = data.scenarios.length > 0
    ? data.requirements.length / data.scenarios.length
    : 0;
    
  // Calculate overall completeness score
  const completenessFactors = [
    data.losses.length > 0 ? 1 : 0,
    data.hazards.length > 0 ? 1 : 0,
    data.controllers.length > 0 ? 1 : 0,
    data.ucas.length > 0 ? 1 : 0,
    data.scenarios.length > 0 ? 1 : 0,
    data.requirements.length > 0 ? 1 : 0,
    metrics.hazardsPerLoss >= 1 ? 1 : metrics.hazardsPerLoss,
    metrics.ucasPerControlAction >= 2 ? 1 : metrics.ucasPerControlAction / 2,
    metrics.scenariosPerUCA >= 0.5 ? 1 : metrics.scenariosPerUCA * 2,
    ucaTypes.size / 4
  ];
  
  const completenessScore = (completenessFactors.reduce((a, b) => a + b, 0) / completenessFactors.length) * 100;
  
  return {
    score: Math.round(completenessScore),
    metrics,
    issues,
    recommendations: generateRecommendations(metrics, issues)
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(metrics: Record<string, number>, _issues: string[]): string[] {
  const recommendations: string[] = [];
  
  if (metrics.hazardsPerLoss < 1) {
    recommendations.push('Consider identifying more hazards - aim for at least 2-3 hazards per loss');
  }
  
  if (metrics.ucasPerControlAction < 2) {
    recommendations.push('Analyze each control action more thoroughly - consider all four UCA types');
  }
  
  if (metrics.scenariosPerUCA < 0.5) {
    recommendations.push('Develop more causal scenarios - each UCA should have at least one scenario');
  }
  
  if (metrics.requirementsPerScenario < 0.8) {
    recommendations.push('Derive safety requirements for all identified scenarios');
  }
  
  return recommendations;
}

/**
 * Generate context suggestions for UCAs
 */
function generateSuggestions(data: {
  controlAction: ControlAction;
  existingUCAs: UnsafeControlAction[];
  hazards: Hazard[];
}) {
  const { controlAction, existingUCAs, hazards: _hazards } = data;
  const suggestions: any[] = [];
  
  // Common context patterns
  const contextPatterns = [
    'during system startup',
    'during system shutdown',
    'during emergency conditions',
    'when system is in degraded mode',
    'when sensors are failed or providing incorrect data',
    'when communication is lost or delayed',
    'when operator is distracted or overwhelmed',
    'when multiple failures occur simultaneously',
    'during maintenance or testing',
    'when environmental conditions exceed limits'
  ];
  
  // Generate suggestions for each UCA type
  Object.values(UCAType).forEach(ucaType => {
    const existingContexts = existingUCAs
      .filter(u => u.ucaType === ucaType)
      .map(u => u.context?.toLowerCase() || '');
      
    contextPatterns.forEach(pattern => {
      // Skip if similar context already exists
      if (existingContexts.some(ctx => ctx.includes(pattern.toLowerCase()))) {
        return;
      }
      
      suggestions.push({
        ucaType,
        context: pattern,
        confidence: 0.7 + Math.random() * 0.3,
        reasoning: `Common hazardous context for ${controlAction.verb} ${controlAction.object}`
      });
    });
  });
  
  // Sort by confidence
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

/**
 * Find patterns in the analysis
 */
function findPatterns(data: {
  ucas: UnsafeControlAction[];
  scenarios: CausalScenario[];
  requirements: Requirement[];
}) {
  const patterns: any[] = [];
  
  // Find common context words
  const contextWords = new Map<string, number>();
  data.ucas.forEach(uca => {
    const words = uca.context?.toLowerCase().split(/\s+/) || [];
    words.forEach(word => {
      if (word.length > 3) {
        contextWords.set(word, (contextWords.get(word) || 0) + 1);
      }
    });
  });
  
  const commonWords = Array.from(contextWords.entries())
    .filter(([_, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  patterns.push({
    type: 'common-context-words',
    data: commonWords.map(([word, count]) => ({ word, count }))
  });
  
  // Find UCA type distribution
  const ucaTypeCount = new Map<UCAType, number>();
  data.ucas.forEach(uca => {
    const count = ucaTypeCount.get(uca.ucaType) || 0;
    ucaTypeCount.set(uca.ucaType, count + 1);
  });
  
  patterns.push({
    type: 'uca-type-distribution',
    data: Array.from(ucaTypeCount.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: (count / data.ucas.length) * 100
    }))
  });
  
  // Find scenarios without requirements
  const scenariosWithoutReqs = data.scenarios.filter(scenario => 
    !data.requirements.some(req => (req.linkedScenarios || req.scenarioIds || []).includes(scenario.id))
  );
  
  if (scenariosWithoutReqs.length > 0) {
    patterns.push({
      type: 'scenarios-without-requirements',
      data: {
        count: scenariosWithoutReqs.length,
        percentage: (scenariosWithoutReqs.length / data.scenarios.length) * 100,
        scenarioIds: scenariosWithoutReqs.map(s => s.id)
      }
    });
  }
  
  return patterns;
}

// Export for TypeScript
export {};