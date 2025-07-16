import { Controller, ControlAction, UCCA, Hazard, PotentialUCCA, SpecialInteractions, UCCAAlgorithmType, UnsafeControlAction } from '@/types/types';
import { 
  UCCAIdentificationAlgorithm, 
  AuthorityTuple, 
  InterchangeableControllers
} from './uccaAlgorithms';

// Enhanced UCCA enumeration based on thesis algorithms with practical implementation

export interface UCCAEnumerationConfig {
  maxCombinationSize: number;
  enableType1_2: boolean;
  enableType3_4: boolean;
  enableAbstraction2a: boolean;
  enableAbstraction2b: boolean;
  riskThreshold: number; // Only include UCCAs above this risk score
  prioritizeByHazards: boolean;
  includeTemporalAnalysis: boolean;
}

export interface EnumerationResult {
  potentialUCCAs: PotentialUCCA[];
  statistics: {
    totalEnumerated: number;
    type1_2Count: number;
    type3_4Count: number;
    abstraction2aCount: number;
    abstraction2bCount: number;
    highRiskCount: number;
    averageRiskScore: number;
  };
  recommendations: string[];
  processingTime: number;
}

export interface UCCAGenerationContext {
  controllers: Controller[];
  controlActions: ControlAction[];
  existingUCAs: UnsafeControlAction[];
  hazards: Hazard[];
  existingUCCAs: UCCA[];
  interchangeableControllers: InterchangeableControllers[];
  specialInteractions: SpecialInteractions;
}

/**
 * Enhanced UCCA enumeration system implementing thesis algorithms
 */
export class EnhancedUCCAEnumerator {
  private config: UCCAEnumerationConfig;

  constructor(config?: Partial<UCCAEnumerationConfig>) {
    this.config = {
      maxCombinationSize: 4,
      enableType1_2: true,
      enableType3_4: true,
      enableAbstraction2a: true,
      enableAbstraction2b: true,
      riskThreshold: 0.3,
      prioritizeByHazards: true,
      includeTemporalAnalysis: true,
      ...config
    };
  }

  /**
   * Main enumeration method implementing Algorithm 1 from the thesis
   */
  async enumerateUCCAs(context: UCCAGenerationContext): Promise<EnumerationResult> {
    const startTime = performance.now();
    
    try {
      // Step 1: Generate potential UCCAs using thesis algorithms
      let potentialUCCAs = await this.generatePotentialUCCAs(context);

      // Step 2: Apply hazard-based filtering and prioritization
      if (this.config.prioritizeByHazards) {
        potentialUCCAs = this.prioritizeByHazardRelevance(potentialUCCAs, context.hazards);
      }

      // Step 3: Filter by controller authority relationships if needed
      // Note: refineAbstractedUCCAs and pruneEquivalentCombinations are not implemented
      // in the base UCCAIdentificationAlgorithm, so we skip these steps

      // Step 5: Apply special interactions and constraints
      potentialUCCAs = this.applySpecialInteractions(potentialUCCAs, context.specialInteractions);

      // Step 6: Filter by risk threshold
      potentialUCCAs = potentialUCCAs.filter(ucca => 
        (ucca.riskScore ?? 0) >= this.config.riskThreshold
      );

      // Step 7: Remove duplicates with existing UCCAs
      potentialUCCAs = this.filterExistingUCCAs(potentialUCCAs, context.existingUCCAs);

      // Step 8: Sort by risk score (highest first)
      potentialUCCAs.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

      const processingTime = performance.now() - startTime;
      
      return {
        potentialUCCAs,
        statistics: this.calculateStatistics(potentialUCCAs),
        recommendations: this.generateRecommendations(potentialUCCAs, context),
        processingTime
      };

    } catch (error) {
      console.error('UCCA enumeration failed:', error);
      throw error;
    }
  }

  /**
   * Generate potential UCCAs using configured algorithms
   */
  private async generatePotentialUCCAs(context: UCCAGenerationContext): Promise<PotentialUCCA[]> {
    const potentialUCCAs: PotentialUCCA[] = [];

    // Use the thesis algorithms from uccaAlgorithms.ts
    const algorithm = new UCCAIdentificationAlgorithm(
      context.controllers,
      context.controlActions,
      context.existingUCAs
    );

    let baseUCCAs: PotentialUCCA[] = [];

    if (this.config.enableAbstraction2a) {
      baseUCCAs.push(...algorithm.enumerateControlActionCombinations('2a', this.config.maxCombinationSize));
    }
    if (this.config.enableAbstraction2b) {
      baseUCCAs.push(...algorithm.enumerateControlActionCombinations('2b', this.config.maxCombinationSize));
    }

    // Filter by enabled algorithm types
    for (const ucca of baseUCCAs) {
      const isType1_2 = ucca.combinationType === 'provide-not-provide';
      const isType3_4 = ucca.combinationType === 'temporal';

      if (isType1_2 && this.config.enableType1_2) {
        potentialUCCAs.push(ucca);
      } else if (isType3_4 && this.config.enableType3_4) {
        potentialUCCAs.push(ucca);
      }
    }

    // Add domain-specific enhancements
    potentialUCCAs.push(...this.generateDomainSpecificUCCAs(context));

    return potentialUCCAs;
  }

  /**
   * Generate domain-specific UCCAs based on aviation safety patterns
   */
  private generateDomainSpecificUCCAs(context: UCCAGenerationContext): PotentialUCCA[] {
    const domainUCCAs: PotentialUCCA[] = [];
    const controllers = context.controllers;
    const actions = context.controlActions;

    // Communication failure patterns
    domainUCCAs.push(...this.generateCommunicationFailureUCCAs(controllers, actions, context.hazards));

    // Resource conflict patterns
    domainUCCAs.push(...this.generateResourceConflictUCCAs(controllers, actions, context.hazards));

    // Emergency response patterns
    domainUCCAs.push(...this.generateEmergencyResponseUCCAs(controllers, actions, context.hazards));

    return domainUCCAs;
  }

  /**
   * Generate UCCAs related to communication failures
   */
  private generateCommunicationFailureUCCAs(
    controllers: Controller[], 
    actions: ControlAction[], 
    _hazards: Hazard[]
  ): PotentialUCCA[] {
    const commUCCAs: PotentialUCCA[] = [];

    // Find communication-related actions
    const commActions = actions.filter(action => 
      /^(transmit|receive|announce|report|request|acknowledge|confirm)/i.test(action.verb)
    );

    // Generate patterns where multiple controllers fail to communicate
    for (let i = 0; i < controllers.length - 1; i++) {
      for (let j = i + 1; j < controllers.length; j++) {
        const controller1 = controllers[i];
        const controller2 = controllers[j];

        const comm1Actions = commActions.filter(action => action.controllerId === controller1.id);
        const comm2Actions = commActions.filter(action => action.controllerId === controller2.id);

        if (comm1Actions.length > 0 && comm2Actions.length > 0) {
          const ucca = {
            controllerIds: [controller1.id, controller2.id],
            controlActionIds: [comm1Actions[0].id, comm2Actions[0].id],
            combinationType: 'provide-not-provide',
            abstractionLevel: '2b',
            description: `Communication breakdown between ${controller1.name} and ${controller2.name}`,
            pattern: 'Domain-specific: Communication failure pattern',
            riskLevel: 'high',
            type: UCCAAlgorithmType.Type1_2,
            riskScore: 0.8
          };
          commUCCAs.push({ ...ucca, id: this.generateUCCAKey(ucca) });
        }
      }
    }

    return commUCCAs;
  }

  /**
   * Generate UCCAs related to resource conflicts
   */
  private generateResourceConflictUCCAs(
    _controllers: Controller[], 
    actions: ControlAction[], 
    _hazards: Hazard[]
  ): PotentialUCCA[] {
    const resourceUCCAs: PotentialUCCA[] = [];

    // Find resource-related actions (shared systems, equipment)
    const resourceActions = actions.filter(action => 
      /^(activate|deactivate|engage|disengage|control|operate)/i.test(action.verb)
    );

    // Group actions by object (potential shared resources)
    const resourceGroups = new Map<string, ControlAction[]>();
    resourceActions.forEach(action => {
      const resource = action.object.toLowerCase();
      if (!resourceGroups.has(resource)) {
        resourceGroups.set(resource, []);
      }
      resourceGroups.get(resource)!.push(action);
    });

    // Generate conflict patterns where multiple controllers try to control same resource
    resourceGroups.forEach((actions, resource) => {
      if (actions.length > 1) {
        const controllerIds = Array.from(new Set(actions.map(a => a.controllerId)));
        
        if (controllerIds.length > 1) {
          // Multiple controllers simultaneously trying to control same resource

          const ucca = {
            controllerIds: controllerIds.slice(0, 3),
            controlActionIds: controllerIds.slice(0, 3).map(controllerId => 
              actions.find(a => a.controllerId === controllerId)!.id
            ),
            combinationType: 'provide-not-provide',
            abstractionLevel: '2b',
            description: `Multiple controllers simultaneously controlling ${resource}`,
            pattern: 'Domain-specific: Resource conflict pattern',
            riskLevel: 'high',
            type: UCCAAlgorithmType.Type1_2,
            riskScore: 0.7
          };
          resourceUCCAs.push({ ...ucca, id: this.generateUCCAKey(ucca) });
        }
      }
    });

    return resourceUCCAs;
  }

  /**
   * Generate UCCAs related to emergency response
   */
  private generateEmergencyResponseUCCAs(
    _controllers: Controller[], 
    actions: ControlAction[], 
    _hazards: Hazard[]
  ): PotentialUCCA[] {
    const emergencyUCCAs: PotentialUCCA[] = [];

    // Find emergency-related actions
    const emergencyActions = actions.filter(action => 
      /^(abort|emergency|eject|deploy|stop|brake|alert|warn)/i.test(action.verb) ||
      /emergency|abort|stop|brake|alert/i.test(action.object)
    );

    // Generate patterns where emergency actions are delayed or conflicting
    if (emergencyActions.length > 1) {
      for (let i = 0; i < emergencyActions.length - 1; i++) {
        for (let j = i + 1; j < emergencyActions.length; j++) {
          const action1 = emergencyActions[i];
          const action2 = emergencyActions[j];

          // Different controllers - one acts too early, other too late
          if (action1.controllerId !== action2.controllerId) {
            const ucca = {
              controllerIds: [action1.controllerId, action2.controllerId],
              controlActionIds: [action1.id, action2.id],
              combinationType: 'temporal',
              abstractionLevel: '2b',
              description: `Emergency response timing conflict: ${action1.verb} ${action1.object} too early, ${action2.verb} ${action2.object} too late`,
              pattern: 'Domain-specific: Emergency response timing pattern',
              riskLevel: 'high',
              type: UCCAAlgorithmType.Type3_4,
              riskScore: 0.9
            };
            emergencyUCCAs.push({ ...ucca, id: this.generateUCCAKey(ucca) });
          }
        }
      }
    }

    return emergencyUCCAs;
  }

  /**
   * Prioritize UCCAs based on hazard relevance
   */
  private prioritizeByHazardRelevance(uccas: PotentialUCCA[], hazards: Hazard[]): PotentialUCCA[] {
    return uccas.map(ucca => {
      // Calculate hazard relevance score
      let hazardRelevance = 0;
      
      for (const hazard of hazards) {
        const hazardText = hazard.title.toLowerCase();
        const uccaText = ucca.description.toLowerCase();
        
        // Simple keyword matching - could be enhanced with NLP
        const commonWords = this.findCommonKeywords(hazardText, uccaText);
        hazardRelevance += commonWords.length * 0.1;
      }

      // Adjust risk score based on hazard relevance
      const adjustedRiskScore = Math.min(1.0, (ucca.riskScore ?? 0) + hazardRelevance);

      return {
        ...ucca,
        riskScore: adjustedRiskScore
      };
    });
  }

  /**
   * Apply special interactions and constraints
   */
  private applySpecialInteractions(
    uccas: PotentialUCCA[], 
    specialInteractions: SpecialInteractions
  ): PotentialUCCA[] {
    let result = [...uccas];

    // Note: mandatoryUCCAs in SpecialInteractions are string IDs,
    // but this method works with PotentialUCCA objects.
    // This would need to be handled at a higher level where UCCAs are managed.

    // Remove excluded UCCAs if they exist
    if (specialInteractions.excludedUCCAs) {
      result = result.filter(ucca => 
        !specialInteractions.excludedUCCAs!.some(excludedId => 
          ucca.id === excludedId
        )
      );
    }

    // Apply priority adjustments if they exist
    if (specialInteractions.priorityAdjustments) {
      result = result.map(ucca => {
        const adjustmentKey = this.generateUCCAKey(ucca);
        const adjustment = specialInteractions.priorityAdjustments![adjustmentKey] || 0;
        
        return {
          ...ucca,
          riskScore: Math.max(0, Math.min(1, (ucca.riskScore ?? 0) + adjustment))
        };
      });
    }

    return result;
  }

  /**
   * Filter out UCCAs that already exist
   */
  private filterExistingUCCAs(potentialUCCAs: PotentialUCCA[], existingUCCAs: UCCA[]): PotentialUCCA[] {
    return potentialUCCAs.filter(potential => 
      !existingUCCAs.some(existing => 
        this.doesUCCAMatchPotential(existing, potential)
      )
    );
  }

  /**
   * Calculate enumeration statistics
   */
  private calculateStatistics(uccas: PotentialUCCA[]) {
    const type1_2Count = uccas.filter(u => u.type === UCCAAlgorithmType.Type1_2).length;
    const type3_4Count = uccas.filter(u => u.type === UCCAAlgorithmType.Type3_4).length;
    const abstraction2aCount = uccas.filter(u => u.abstractionLevel === '2a').length;
    const abstraction2bCount = uccas.filter(u => u.abstractionLevel === '2b').length;
    const highRiskCount = uccas.filter(u => (u.riskScore ?? 0) >= 0.7).length;
    const averageRiskScore = uccas.length > 0 ? 
      uccas.reduce((sum, u) => sum + (u.riskScore ?? 0), 0) / uccas.length : 0;

    return {
      totalEnumerated: uccas.length,
      type1_2Count,
      type3_4Count,
      abstraction2aCount,
      abstraction2bCount,
      highRiskCount,
      averageRiskScore
    };
  }

  /**
   * Generate recommendations based on enumeration results
   */
  private generateRecommendations(uccas: PotentialUCCA[], _context: UCCAGenerationContext): string[] {
    const recommendations: string[] = [];

    const highRiskUCCAs = uccas.filter(u => (u.riskScore ?? 0) >= 0.8);
    if (highRiskUCCAs.length > 0) {
      recommendations.push(`${highRiskUCCAs.length} high-risk UCCA patterns identified - prioritize analysis of these combinations`);
    }

    const communicationUCCAs = uccas.filter(u => 
      u.description.toLowerCase().includes('communication') || 
      u.description.toLowerCase().includes('transmit')
    );
    if (communicationUCCAs.length > 0) {
      recommendations.push(`Communication-related UCCAs detected - review coordination protocols between controllers`);
    }

    const temporalUCCAs = uccas.filter(u => u.combinationType === 'temporal');
    if (temporalUCCAs.length > 0) {
      recommendations.push(`Temporal sequencing issues identified - review timing protocols and coordination mechanisms`);
    }

    const resourceUCCAs = uccas.filter(u => u.description.toLowerCase().includes('simultaneously'));
    if (resourceUCCAs.length > 0) {
      recommendations.push(`Resource conflict patterns detected - establish clear authority and arbitration mechanisms`);
    }

    if (uccas.length === 0) {
      recommendations.push('No new UCCA patterns identified - current analysis may be comprehensive or constraints too restrictive');
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  private findCommonKeywords(text1: string, text2: string): string[] {
    const words1 = text1.split(/\s+/).filter(w => w.length > 3);
    const words2 = text2.split(/\s+/).filter(w => w.length > 3);
    return words1.filter(w => words2.includes(w));
  }


  private generateUCCAKey(ucca: PotentialUCCA): string {
    const controllerPart = ucca.controllerIds.sort().join('-');
    const actionPart = ucca.controlActionIds.sort().join('-');
    return `${controllerPart}|${actionPart}|${ucca.combinationType}`;
  }

  private doesUCCAMatchPotential(existing: UCCA, potential: PotentialUCCA): boolean {
    const potentialKey = this.generateUCCAKey(potential);
    const existingKey = this.generateUCCAKey({
      ...existing,
      controllerIds: existing.involvedControllerIds,
      combinationType: potential.combinationType, // This might need a better mapping
    });
    return potentialKey === existingKey;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set(Array.from(words1).filter(w => words2.has(w)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    return intersection.size / union.size;
  }
}

/**
 * Factory function to create authority tuple from analysis data
 */
/**
 * Helper function to identify authority relationships between controllers
 * Returns array of [superior, subordinate] tuples
 */
export const identifyAuthorityTuples = (
  controllers: Controller[]
): AuthorityTuple[] => {
  const tuples: AuthorityTuple[] = [];
  
  // Simple heuristic: look for hierarchical relationships based on names
  // In a real implementation, this would use actual organizational data
  for (let i = 0; i < controllers.length; i++) {
    for (let j = 0; j < controllers.length; j++) {
      if (i !== j) {
        const controller1 = controllers[i];
        const controller2 = controllers[j];
        
        // Check for common hierarchical patterns
        if (controller1.name.toLowerCase().includes('supervisor') && 
            !controller2.name.toLowerCase().includes('supervisor')) {
          tuples.push([controller1.id, controller2.id]);
        } else if (controller1.name.toLowerCase().includes('manager') && 
                   controller2.name.toLowerCase().includes('operator')) {
          tuples.push([controller1.id, controller2.id]);
        }
      }
    }
  }
  
  return tuples;
};

/**
 * Default configuration for aviation safety analysis
 */
export const getAviationSafetyConfig = (): UCCAEnumerationConfig => ({
  maxCombinationSize: 3, // Keep manageable for aviation complexity
  enableType1_2: true,
  enableType3_4: true,
  enableAbstraction2a: false, // Focus on explicit controllers in aviation
  enableAbstraction2b: true,
  riskThreshold: 0.4, // Include medium-risk UCCAs for thoroughness
  prioritizeByHazards: true,
  includeTemporalAnalysis: true
});

export default EnhancedUCCAEnumerator;