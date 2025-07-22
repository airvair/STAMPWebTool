/**
 * Risk Scoring Engine for UCAs
 * Implements sophisticated risk assessment based on multiple factors
 */

import { 
  UnsafeControlAction, 
  Hazard, 
  Controller, 
  ControlAction,
  CausalScenario,
  UCAType,
  ControllerType
} from '@/types/types';

// Risk factors and their weights
export interface RiskFactors {
  hazardSeverity: number;          // 0-1, based on linked hazards
  controllerCriticality: number;   // 0-1, based on controller types
  actionCriticality: number;       // 0-1, based on action types
  temporalComplexity: number;      // 0-1, based on timing issues
  contextSpecificity: number;      // 0-1, based on context quality
  historicalIncidents: number;     // 0-1, based on similar past issues
  mitigationDifficulty: number;    // 0-1, how hard to mitigate
}

export interface RiskScore {
  overall: number;            // 0-1, weighted average
  factors: RiskFactors;       // Individual factor scores
  category: RiskCategory;     // Risk categorization
  confidence: number;         // 0-1, confidence in assessment
  rationale: string[];        // Explanation of score
}

export enum RiskCategory {
  CRITICAL = 'Critical',      // 0.8-1.0
  HIGH = 'High',             // 0.6-0.8
  MEDIUM = 'Medium',         // 0.4-0.6
  LOW = 'Low',               // 0.2-0.4
  MINIMAL = 'Minimal'        // 0-0.2
}

// Domain-specific risk patterns
interface RiskPattern {
  name: string;
  description: string;
  keywords: string[];
  baseRisk: number;
  applicableTo: ('uca')[];
}

const AVIATION_RISK_PATTERNS: RiskPattern[] = [
  {
    name: 'Emergency Response Delay',
    description: 'Delays in emergency actions have catastrophic consequences',
    keywords: ['emergency', 'abort', 'eject', 'brake', 'stop', 'alert'],
    baseRisk: 0.9,
    applicableTo: ['uca']
  },
  {
    name: 'Mode Confusion',
    description: 'Incorrect mode assumptions lead to wrong control actions',
    keywords: ['mode', 'state', 'configuration', 'setting'],
    baseRisk: 0.8,
    applicableTo: ['uca']
  },
  {
    name: 'Authority Conflict',
    description: 'Multiple controllers issuing conflicting commands',
    keywords: ['conflict', 'override', 'simultaneous', 'both', 'multiple'],
    baseRisk: 0.85,
    applicableTo: ['uca']
  },
  {
    name: 'Communication Failure',
    description: 'Loss of critical communication between controllers',
    keywords: ['transmit', 'receive', 'communicate', 'report', 'acknowledge'],
    baseRisk: 0.75,
    applicableTo: ['uca']
  },
  {
    name: 'Sensor Degradation',
    description: 'Actions based on degraded or incorrect sensor data',
    keywords: ['sensor', 'measurement', 'reading', 'detection', 'monitoring'],
    baseRisk: 0.7,
    applicableTo: ['uca']
  }
];

/**
 * Main risk scoring engine
 */
export class RiskScoringEngine {
  private weights = {
    hazardSeverity: 0.25,
    controllerCriticality: 0.20,
    actionCriticality: 0.15,
    temporalComplexity: 0.15,
    contextSpecificity: 0.10,
    historicalIncidents: 0.03,
    mitigationDifficulty: 0.02
  };

  /**
   * Calculate risk score for a UCA
   */
  calculateUCARisk(
    uca: UnsafeControlAction,
    hazards: Hazard[],
    controller: Controller,
    controlAction: ControlAction,
    scenarios?: CausalScenario[]
  ): RiskScore {
    const factors = this.calculateUCAFactors(uca, hazards, controller, controlAction, scenarios);
    const overall = this.calculateWeightedScore(factors);
    const category = this.categorizeRisk(overall);
    const confidence = this.calculateConfidence(uca, factors);
    const rationale = this.generateRationale(factors, 'uca', uca);

    return {
      overall,
      factors,
      category,
      confidence,
      rationale
    };
  }


  /**
   * Calculate UCA risk factors
   */
  private calculateUCAFactors(
    uca: UnsafeControlAction,
    hazards: Hazard[],
    controller: Controller,
    controlAction: ControlAction,
    scenarios?: CausalScenario[]
  ): RiskFactors {
    // Hazard severity based on linked hazards
    const linkedHazards = hazards.filter(h => uca.hazardIds.includes(h.id));
    const hazardSeverity = this.calculateHazardSeverity(linkedHazards);

    // Controller criticality
    const controllerCriticality = this.calculateControllerCriticality(controller);

    // Action criticality
    const actionCriticality = this.calculateActionCriticality(controlAction);

    // Temporal complexity for timing-related UCAs
    const temporalComplexity = this.calculateTemporalComplexity(uca.ucaType);

    // Context specificity - better defined contexts have lower risk
    const contextSpecificity = this.calculateContextSpecificity(uca.context);

    // Historical incidents (simulated - would connect to incident database)
    const historicalIncidents = this.calculateHistoricalRisk(uca, controller, controlAction);

    // Mitigation difficulty
    const mitigationDifficulty = this.calculateMitigationDifficulty(
      uca, 
      scenarios || [], 
      controller.ctrlType
    );

    return {
      hazardSeverity,
      controllerCriticality,
      actionCriticality,
      temporalComplexity,
      contextSpecificity,
      historicalIncidents,
      mitigationDifficulty
    };
  }


  /**
   * Calculate hazard severity score
   */
  private calculateHazardSeverity(hazards: Hazard[]): number {
    if (hazards.length === 0) return 0.5;

    let maxSeverity = 0;
    hazards.forEach(hazard => {
      const hazardText = hazard.title.toLowerCase();
      
      // Critical keywords
      if (hazardText.includes('death') || hazardText.includes('fatal') || 
          hazardText.includes('catastrophic')) {
        maxSeverity = Math.max(maxSeverity, 1.0);
      }
      // High severity keywords
      else if (hazardText.includes('injury') || hazardText.includes('collision') || 
               hazardText.includes('crash')) {
        maxSeverity = Math.max(maxSeverity, 0.8);
      }
      // Medium severity keywords
      else if (hazardText.includes('damage') || hazardText.includes('failure')) {
        maxSeverity = Math.max(maxSeverity, 0.6);
      }
      // Default
      else {
        maxSeverity = Math.max(maxSeverity, 0.4);
      }
    });

    return maxSeverity;
  }

  /**
   * Calculate controller criticality
   */
  private calculateControllerCriticality(controller: Controller): number {
    const criticalityMap: Record<ControllerType, number> = {
      [ControllerType.Software]: 0.7,      // Automation issues
      [ControllerType.Human]: 0.6,         // Human error potential
      [ControllerType.Team]: 0.8,          // Coordination complexity
      [ControllerType.Organisation]: 0.5,   // Indirect but important
    };

    return criticalityMap[controller.ctrlType] || 0.5;
  }

  /**
   * Calculate action criticality
   */
  private calculateActionCriticality(action: ControlAction): number {
    const actionText = `${action.verb} ${action.object}`.toLowerCase();
    
    // Check against risk patterns
    let maxCriticality = 0.5; // Default
    
    AVIATION_RISK_PATTERNS.forEach(pattern => {
      if (pattern.keywords.some(keyword => actionText.includes(keyword))) {
        maxCriticality = Math.max(maxCriticality, pattern.baseRisk);
      }
    });

    return maxCriticality;
  }

  /**
   * Calculate temporal complexity
   */
  private calculateTemporalComplexity(ucaType: UCAType): number {
    const complexityMap: Record<UCAType, number> = {
      [UCAType.NotProvided]: 0.3,
      [UCAType.ProvidedUnsafe]: 0.4,
      [UCAType.TooEarly]: 0.7,
      [UCAType.TooLate]: 0.8,
      [UCAType.WrongOrder]: 0.9,
      [UCAType.TooLong]: 0.6,
      [UCAType.TooShort]: 0.6
    };

    return complexityMap[ucaType] || 0.5;
  }

  /**
   * Calculate context specificity score
   */
  private calculateContextSpecificity(context: string): number {
    if (!context) return 0.8; // No context is high risk

    const contextLength = context.length;
    const hasTemporalElement = /during|before|after|while|when/.test(context.toLowerCase());
    const hasSpecificCondition = /if|unless|only|except/.test(context.toLowerCase());
    const hasVagueTerms = /sometimes|maybe|possibly|might/.test(context.toLowerCase());

    let score = 0.5; // Base score

    // Better defined contexts have lower risk
    if (contextLength > 100) score -= 0.2;
    else if (contextLength > 50) score -= 0.1;
    
    if (hasTemporalElement) score -= 0.1;
    if (hasSpecificCondition) score -= 0.1;
    if (hasVagueTerms) score += 0.2; // Vague contexts are riskier

    return Math.max(0, Math.min(1, score));
  }


  /**
   * Calculate historical risk (simulated)
   */
  private calculateHistoricalRisk(
    uca: UnsafeControlAction,
    controller: Controller,
    action: ControlAction
  ): number {
    // In a real system, this would query an incident database
    // For now, use pattern matching
    const actionText = `${action.verb} ${action.object}`.toLowerCase();
    
    // Known problematic patterns
    if (actionText.includes('mode') && controller.ctrlType === ControllerType.Human) {
      return 0.7; // Mode confusion is historically common
    }
    if (actionText.includes('altitude') && uca.ucaType === UCAType.TooLate) {
      return 0.8; // Altitude-related delays are critical
    }
    
    return 0.3; // Default low historical risk
  }

  /**
   * Calculate mitigation difficulty
   */
  private calculateMitigationDifficulty(
    uca: UnsafeControlAction,
    scenarios: CausalScenario[],
    controllerType: ControllerType
  ): number {
    let difficulty = 0.5; // Base difficulty

    // More causal scenarios = harder to mitigate
    difficulty += scenarios.length * 0.05;

    // Software changes are often easier than hardware
    if (controllerType === ControllerType.Software) {
      difficulty -= 0.1;
    }

    // Timing issues are harder to mitigate
    if ([UCAType.TooEarly, UCAType.TooLate, UCAType.WrongOrder].includes(uca.ucaType)) {
      difficulty += 0.15;
    }

    return Math.min(1, Math.max(0, difficulty));
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(factors: RiskFactors): number {
    let score = 0;
    
    Object.entries(this.weights).forEach(([factor, weight]) => {
      score += factors[factor as keyof RiskFactors] * weight;
    });

    // Apply pattern matching boost
    return Math.min(1, score);
  }

  /**
   * Categorize risk level
   */
  private categorizeRisk(score: number): RiskCategory {
    if (score >= 0.8) return RiskCategory.CRITICAL;
    if (score >= 0.6) return RiskCategory.HIGH;
    if (score >= 0.4) return RiskCategory.MEDIUM;
    if (score >= 0.2) return RiskCategory.LOW;
    return RiskCategory.MINIMAL;
  }

  /**
   * Calculate confidence in risk assessment
   */
  private calculateConfidence(
    entity: UnsafeControlAction,
    factors: RiskFactors
  ): number {
    let confidence = 0.7; // Base confidence

    // More complete information increases confidence
    if ('hazardIds' in entity && entity.hazardIds.length > 0) {
      confidence += 0.1;
    }

    if ('context' in entity && entity.context && entity.context.length > 50) {
      confidence += 0.1;
    }

    // Extreme values decrease confidence (might be anomalies)
    const extremeFactors = Object.values(factors).filter(
      f => f > 0.9 || f < 0.1
    ).length;
    confidence -= extremeFactors * 0.05;

    return Math.max(0.3, Math.min(1, confidence));
  }

  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    factors: RiskFactors,
    type: 'uca',
    _entity: UnsafeControlAction
  ): string[] {
    const rationale: string[] = [];

    // Hazard severity
    if (factors.hazardSeverity >= 0.8) {
      rationale.push('Linked to critical hazards with potential for catastrophic outcomes');
    } else if (factors.hazardSeverity >= 0.6) {
      rationale.push('Associated with significant safety hazards');
    }

    // Controller criticality
    if (factors.controllerCriticality >= 0.7) {
      rationale.push('Involves highly critical controllers where failures have severe impact');
    }

    // Temporal complexity
    if (factors.temporalComplexity >= 0.7) {
      rationale.push('Complex timing requirements increase likelihood of errors');
    }


    // Context quality
    if (factors.contextSpecificity >= 0.7) {
      rationale.push('Vague or incomplete context definition increases uncertainty');
    }

    // Default if no specific factors
    if (rationale.length === 0) {
      rationale.push('Moderate risk based on standard safety analysis criteria');
    }

    return rationale;
  }

  /**
   * Batch calculate risks for multiple entities
   */
  batchCalculateRisks<T extends UnsafeControlAction>(
    entities: T[],
    hazards: Hazard[],
    controllers: Controller[],
    controlActions: ControlAction[]
  ): Map<string, RiskScore> {
    const riskMap = new Map<string, RiskScore>();

    entities.forEach(entity => {
      if ('ucaType' in entity) {
        // It's a UCA
        const controller = controllers.find(c => c.id === entity.controllerId);
        const action = controlActions.find(a => a.id === entity.controlActionId);
        
        if (controller && action) {
          const risk = this.calculateUCARisk(entity as UnsafeControlAction, hazards, controller, action);
          riskMap.set(entity.id, risk);
        }
      }
    });

    return riskMap;
  }

  /**
   * Get risk mitigation recommendations
   */
  getMitigationRecommendations(riskScore: RiskScore, entityType: 'uca'): string[] {
    const recommendations: string[] = [];

    if (riskScore.factors.hazardSeverity >= 0.8) {
      recommendations.push('Implement multiple independent safety barriers');
      recommendations.push('Consider fail-safe design principles');
    }

    if (riskScore.factors.temporalComplexity >= 0.7) {
      recommendations.push('Add timing monitors and alerts');
      recommendations.push('Implement time-based interlocks');
    }


    if (riskScore.factors.contextSpecificity >= 0.6) {
      recommendations.push('Refine and clarify triggering conditions');
      recommendations.push('Add explicit mode awareness indicators');
    }

    return recommendations;
  }
}

// Export singleton instance
export const riskScoringEngine = new RiskScoringEngine();