import { Controller, ControlAction, UCCA, UCCAType, Hazard } from '@/types';

// Types based on the thesis algorithms
export enum UCCAAlgorithmType {
  Type1_2 = 'Type1-2',
  Type3_4 = 'Type3-4'
}

export enum AbstractionLevel {
  Abstraction2a = 'Abstraction2a', // Team actions (abstract controllers)
  Abstraction2b = 'Abstraction2b'  // Controller actions (explicit controllers)
}

export interface AuthorityTuple {
  controllers: Set<Controller>;
  controlActions: Set<ControlAction>;
  authorities: Map<string, Set<string>>; // controllerId -> set of actionIds
}

export interface ControlCombination {
  controllerId: string;
  actionId: string;
  provided: boolean; // true = provide, false = not provide
  timing?: 'early' | 'late' | 'too-long' | 'too-short';
}

export interface PotentialUCCA {
  type: UCCAAlgorithmType;
  abstraction: AbstractionLevel;
  combinations: ControlCombination[];
  description: string;
  riskScore: number;
  enumerationReason: string;
}

export interface InterchangeableControllers {
  groups: Controller[][]; // Groups of controllers that are functionally equivalent
}

export interface SpecialInteractions {
  mandatoryUCCAs: PotentialUCCA[]; // UCCAs that must be included
  excludedUCCAs: PotentialUCCA[]; // UCCAs to exclude from analysis
  priorityAdjustments: Map<string, number>; // Adjustments to risk scores
}

/**
 * Implementation of Algorithm 1 from the UCCA thesis
 * Main UCCA Identification Algorithm
 */
export class UCCAIdentificationAlgorithm {
  
  /**
   * Line 1: Automated enumeration of potential UCCAs
   * Based on Sections 4.2.1-4.2.3 of the thesis
   */
  static enumerateControlActionCombinations(
    authorityTuple: AuthorityTuple,
    maxCombinationSize: number = 4
  ): PotentialUCCA[] {
    const potentialUCCAs: PotentialUCCA[] = [];
    
    // Generate Type 1-2 UCCAs (provide/not provide combinations)
    potentialUCCAs.push(...this.generateType1_2UCCAs(authorityTuple, maxCombinationSize));
    
    // Generate Type 3-4 UCCAs (temporal combinations)
    potentialUCCAs.push(...this.generateType3_4UCCAs(authorityTuple, maxCombinationSize));
    
    return potentialUCCAs;
  }

  /**
   * Generate Type 1-2 UCCAs using both Abstraction 2a and 2b
   * Type 1-2 focus on whether control actions are provided or not
   */
  private static generateType1_2UCCAs(
    authorityTuple: AuthorityTuple,
    maxCombinationSize: number
  ): PotentialUCCA[] {
    const uccas: PotentialUCCA[] = [];
    
    // Abstraction 2a: Team-level actions (abstract away specific controllers)
    uccas.push(...this.generateAbstraction2aUCCAs(authorityTuple, maxCombinationSize));
    
    // Abstraction 2b: Controller-specific actions (keep controllers explicit)
    uccas.push(...this.generateAbstraction2bUCCAs(authorityTuple, maxCombinationSize));
    
    return uccas;
  }

  /**
   * Abstraction 2a: Focus on combinations of actions by the team
   * Abstract away which specific controllers provide the actions
   */
  private static generateAbstraction2aUCCAs(
    authorityTuple: AuthorityTuple,
    maxCombinationSize: number
  ): PotentialUCCA[] {
    const uccas: PotentialUCCA[] = [];
    const actions = Array.from(authorityTuple.controlActions);
    
    // Generate combinations of 2 to maxCombinationSize actions
    for (let size = 2; size <= Math.min(maxCombinationSize, actions.length); size++) {
      const actionCombinations = this.generateCombinations(actions, size);
      
      for (const actionCombo of actionCombinations) {
        // For each action combination, generate provide/not-provide patterns
        const providePatterns = this.generateProvidePatterns(actionCombo.length);
        
        for (const pattern of providePatterns) {
          const combinations: ControlCombination[] = [];
          
          for (let i = 0; i < actionCombo.length; i++) {
            const action = actionCombo[i];
            const provided = pattern[i];
            
            // For Abstraction 2a, we use a generic "Team" controller
            combinations.push({
              controllerId: 'team-abstract',
              actionId: action.id,
              provided: provided
            });
          }
          
          const description = this.generateAbstraction2aDescription(actionCombo, pattern);
          const riskScore = this.calculateType1_2RiskScore(combinations, authorityTuple);
          
          uccas.push({
            type: UCCAAlgorithmType.Type1_2,
            abstraction: AbstractionLevel.Abstraction2a,
            combinations,
            description,
            riskScore,
            enumerationReason: 'Team-level action combination analysis'
          });
        }
      }
    }
    
    return uccas;
  }

  /**
   * Abstraction 2b: Focus on combinations of controllers providing common actions
   * Keep controllers explicit in the analysis
   */
  private static generateAbstraction2bUCCAs(
    authorityTuple: AuthorityTuple,
    maxCombinationSize: number
  ): PotentialUCCA[] {
    const uccas: PotentialUCCA[] = [];
    const controllers = Array.from(authorityTuple.controllers);
    const actions = Array.from(authorityTuple.controlActions);
    
    // For each action, find controllers that can provide it
    for (const action of actions) {
      const capableControllers = controllers.filter(controller => 
        authorityTuple.authorities.get(controller.id)?.has(action.id)
      );
      
      if (capableControllers.length > 1) {
        // Generate combinations of controllers for this action
        for (let size = 2; size <= Math.min(maxCombinationSize, capableControllers.length); size++) {
          const controllerCombos = this.generateCombinations(capableControllers, size);
          
          for (const controllerCombo of controllerCombos) {
            const providePatterns = this.generateProvidePatterns(controllerCombo.length);
            
            for (const pattern of providePatterns) {
              const combinations: ControlCombination[] = [];
              
              for (let i = 0; i < controllerCombo.length; i++) {
                combinations.push({
                  controllerId: controllerCombo[i].id,
                  actionId: action.id,
                  provided: pattern[i]
                });
              }
              
              const description = this.generateAbstraction2bDescription(controllerCombo, action, pattern);
              const riskScore = this.calculateType1_2RiskScore(combinations, authorityTuple);
              
              uccas.push({
                type: UCCAAlgorithmType.Type1_2,
                abstraction: AbstractionLevel.Abstraction2b,
                combinations,
                description,
                riskScore,
                enumerationReason: `Multiple controllers can provide ${action.verb} ${action.object}`
              });
            }
          }
        }
      }
    }
    
    return uccas;
  }

  /**
   * Generate Type 3-4 UCCAs focusing on temporal relationships
   * Type 3-4 focus on timing of control actions (early/late, too long/short)
   */
  private static generateType3_4UCCAs(
    authorityTuple: AuthorityTuple,
    maxCombinationSize: number
  ): PotentialUCCA[] {
    const uccas: PotentialUCCA[] = [];
    const controllers = Array.from(authorityTuple.controllers);
    const actions = Array.from(authorityTuple.controlActions);
    
    // Generate temporal combinations between different controllers' actions
    for (let size = 2; size <= Math.min(maxCombinationSize, controllers.length); size++) {
      const controllerCombos = this.generateCombinations(controllers, size);
      
      for (const controllerCombo of controllerCombos) {
        // For each controller, get their available actions
        const controllerActions = controllerCombo.map(controller => ({
          controller,
          actions: actions.filter(action => 
            authorityTuple.authorities.get(controller.id)?.has(action.id)
          )
        }));
        
        // Generate temporal patterns
        const temporalPatterns = ['early', 'late', 'too-long', 'too-short'] as const;
        
        for (const caCombo of this.generateActionCombinations(controllerActions)) {
          for (const pattern of this.generateTemporalPatterns(caCombo.length)) {
            const combinations: ControlCombination[] = caCombo.map((item, index) => ({
              controllerId: item.controller.id,
              actionId: item.action.id,
              provided: true, // Type 3-4 assumes actions are provided
              timing: pattern[index]
            }));
            
            const description = this.generateType3_4Description(caCombo, pattern);
            const riskScore = this.calculateType3_4RiskScore(combinations, authorityTuple);
            
            uccas.push({
              type: UCCAAlgorithmType.Type3_4,
              abstraction: AbstractionLevel.Abstraction2b, // Type 3-4 keeps controllers explicit
              combinations,
              description,
              riskScore,
              enumerationReason: 'Temporal sequencing analysis'
            });
          }
        }
      }
    }
    
    return uccas;
  }

  /**
   * Line 6: Refine abstracted UCCAs to specific controller combinations
   */
  static refineAbstractedUCCAs(
    abstractedUCCAs: PotentialUCCA[],
    authorityTuple: AuthorityTuple
  ): PotentialUCCA[] {
    const refinedUCCAs: PotentialUCCA[] = [];
    
    for (const ucca of abstractedUCCAs) {
      if (ucca.abstraction === AbstractionLevel.Abstraction2a) {
        // Refine team-level UCCAs to specific controller combinations
        const refinedVersions = this.expandAbstraction2aUCCA(ucca, authorityTuple);
        refinedUCCAs.push(...refinedVersions);
      } else {
        // Abstraction 2b UCCAs are already controller-specific
        refinedUCCAs.push(ucca);
      }
    }
    
    return refinedUCCAs;
  }

  /**
   * Line 7: Prune equivalent combinations using interchangeable controllers
   */
  static pruneEquivalentCombinations(
    uccas: PotentialUCCA[],
    interchangeableControllers: InterchangeableControllers
  ): PotentialUCCA[] {
    const prunedUCCAs: PotentialUCCA[] = [];
    
    for (const ucca of uccas) {
      const isEquivalent = prunedUCCAs.some(existing => 
        this.areUCCAsEquivalent(ucca, existing, interchangeableControllers)
      );
      
      if (!isEquivalent) {
        prunedUCCAs.push(ucca);
      }
    }
    
    return prunedUCCAs;
  }

  /**
   * Line 8: Prioritize UCCAs based on risk scores and heuristics
   */
  static prioritizeUCCAs(
    uccas: PotentialUCCA[],
    specialInteractions?: SpecialInteractions
  ): PotentialUCCA[] {
    let prioritizedUCCAs = [...uccas];
    
    // Apply special interaction adjustments
    if (specialInteractions) {
      prioritizedUCCAs = this.applySpecialInteractions(prioritizedUCCAs, specialInteractions);
    }
    
    // Sort by risk score (highest first)
    prioritizedUCCAs.sort((a, b) => b.riskScore - a.riskScore);
    
    return prioritizedUCCAs;
  }

  // Helper methods for enumeration
  private static generateCombinations<T>(array: T[], size: number): T[][] {
    if (size === 1) return array.map(item => [item]);
    if (size > array.length) return [];
    
    const combinations: T[][] = [];
    for (let i = 0; i <= array.length - size; i++) {
      const smaller = this.generateCombinations(array.slice(i + 1), size - 1);
      combinations.push(...smaller.map(combo => [array[i], ...combo]));
    }
    return combinations;
  }

  private static generateProvidePatterns(size: number): boolean[][] {
    const patterns: boolean[][] = [];
    const totalPatterns = Math.pow(2, size);
    
    for (let i = 1; i < totalPatterns - 1; i++) { // Exclude all-false and all-true
      const pattern: boolean[] = [];
      for (let j = 0; j < size; j++) {
        pattern.push((i & (1 << j)) !== 0);
      }
      patterns.push(pattern);
    }
    
    return patterns;
  }

  private static generateTemporalPatterns(size: number): Array<Array<'early' | 'late' | 'too-long' | 'too-short'>> {
    const options = ['early', 'late', 'too-long', 'too-short'] as const;
    const patterns: Array<Array<typeof options[number]>> = [];
    
    // Generate a subset of meaningful temporal patterns to avoid explosion
    for (let i = 0; i < Math.min(16, Math.pow(options.length, size)); i++) {
      const pattern: Array<typeof options[number]> = [];
      let temp = i;
      for (let j = 0; j < size; j++) {
        pattern.push(options[temp % options.length]);
        temp = Math.floor(temp / options.length);
      }
      patterns.push(pattern);
    }
    
    return patterns;
  }

  private static generateActionCombinations(
    controllerActions: Array<{ controller: Controller; actions: ControlAction[] }>
  ): Array<{ controller: Controller; action: ControlAction }> {
    // For simplicity, take one action per controller
    return controllerActions
      .filter(ca => ca.actions.length > 0)
      .map(ca => ({ controller: ca.controller, action: ca.actions[0] }));
  }

  // Description generators
  private static generateAbstraction2aDescription(
    actions: ControlAction[],
    pattern: boolean[]
  ): string {
    const providedActions = actions.filter((_, i) => pattern[i]);
    const notProvidedActions = actions.filter((_, i) => !pattern[i]);
    
    let description = 'Team ';
    if (providedActions.length > 0) {
      description += `provides ${providedActions.map(a => `${a.verb} ${a.object}`).join(', ')}`;
    }
    if (notProvidedActions.length > 0) {
      if (providedActions.length > 0) description += ' but ';
      description += `does not provide ${notProvidedActions.map(a => `${a.verb} ${a.object}`).join(', ')}`;
    }
    
    return description;
  }

  private static generateAbstraction2bDescription(
    controllers: Controller[],
    action: ControlAction,
    pattern: boolean[]
  ): string {
    const providing = controllers.filter((_, i) => pattern[i]);
    const notProviding = controllers.filter((_, i) => !pattern[i]);
    
    let description = '';
    if (providing.length > 0) {
      description += `${providing.map(c => c.name).join(', ')} provide${providing.length === 1 ? 's' : ''} ${action.verb} ${action.object}`;
    }
    if (notProviding.length > 0) {
      if (providing.length > 0) description += ' while ';
      description += `${notProviding.map(c => c.name).join(', ')} do${notProviding.length === 1 ? 'es' : ''} not provide ${action.verb} ${action.object}`;
    }
    
    return description;
  }

  private static generateType3_4Description(
    actionCombination: Array<{ controller: Controller; action: ControlAction }>,
    timingPattern: Array<'early' | 'late' | 'too-long' | 'too-short'>
  ): string {
    const descriptions = actionCombination.map((item, index) => 
      `${item.controller.name} provides ${item.action.verb} ${item.action.object} ${timingPattern[index]}`
    );
    
    return descriptions.join(' and ');
  }

  // Risk scoring methods
  private static calculateType1_2RiskScore(
    combinations: ControlCombination[],
    authorityTuple: AuthorityTuple
  ): number {
    let score = 0;
    
    // Base score for multiple controllers
    const uniqueControllers = new Set(combinations.map(c => c.controllerId));
    score += uniqueControllers.size * 10;
    
    // Penalty for mixed provide/not-provide patterns (higher risk)
    const providedCount = combinations.filter(c => c.provided).length;
    const notProvidedCount = combinations.length - providedCount;
    if (providedCount > 0 && notProvidedCount > 0) {
      score += 20;
    }
    
    // Bonus for actions that affect the same system component
    score += this.calculateActionRelatednessBonus(combinations, authorityTuple);
    
    return Math.min(score, 100);
  }

  private static calculateType3_4RiskScore(
    combinations: ControlCombination[],
    authorityTuple: AuthorityTuple
  ): number {
    let score = 0;
    
    // Base score for temporal coordination complexity
    score += combinations.length * 15;
    
    // Higher score for timing conflicts (early vs late)
    const timings = combinations.map(c => c.timing).filter(Boolean);
    const hasEarly = timings.includes('early');
    const hasLate = timings.includes('late');
    if (hasEarly && hasLate) {
      score += 25;
    }
    
    // Bonus for duration mismatches (too-long vs too-short)
    const hasTooLong = timings.includes('too-long');
    const hasTooShort = timings.includes('too-short');
    if (hasTooLong && hasTooShort) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  private static calculateActionRelatednessBonus(
    combinations: ControlCombination[],
    authorityTuple: AuthorityTuple
  ): number {
    // Simple heuristic: actions with similar verbs are more related
    const verbs = combinations.map(c => {
      const action = Array.from(authorityTuple.controlActions).find(a => a.id === c.actionId);
      return action?.verb.toLowerCase();
    }).filter(Boolean);
    
    const uniqueVerbs = new Set(verbs);
    
    // If actions share verbs, they're likely related
    if (uniqueVerbs.size < verbs.length) {
      return 15;
    }
    
    return 0;
  }

  // Helper methods for refinement and pruning
  private static expandAbstraction2aUCCA(
    ucca: PotentialUCCA,
    authorityTuple: AuthorityTuple
  ): PotentialUCCA[] {
    // Convert team-level UCCA to specific controller combinations
    const expandedUCCAs: PotentialUCCA[] = [];
    
    // For each action in the UCCA, find all controllers that can provide it
    const actionControllerMap = new Map<string, Controller[]>();
    
    for (const combination of ucca.combinations) {
      const capableControllers = Array.from(authorityTuple.controllers).filter(controller =>
        authorityTuple.authorities.get(controller.id)?.has(combination.actionId)
      );
      actionControllerMap.set(combination.actionId, capableControllers);
    }
    
    // Generate specific controller assignments (simplified for complexity management)
    const assignments = this.generateControllerAssignments(actionControllerMap);
    
    for (const assignment of assignments.slice(0, 10)) { // Limit to prevent explosion
      const refinedCombinations: ControlCombination[] = ucca.combinations.map(combo => ({
        ...combo,
        controllerId: assignment.get(combo.actionId)?.id || combo.controllerId
      }));
      
      expandedUCCAs.push({
        ...ucca,
        combinations: refinedCombinations,
        abstraction: AbstractionLevel.Abstraction2b
      });
    }
    
    return expandedUCCAs;
  }

  private static generateControllerAssignments(
    actionControllerMap: Map<string, Controller[]>
  ): Map<string, Controller>[] {
    // Generate a limited set of controller assignments to avoid combinatorial explosion
    const assignments: Map<string, Controller>[] = [];
    const actions = Array.from(actionControllerMap.keys());
    
    // Simple strategy: one assignment per action using first available controller
    const assignment = new Map<string, Controller>();
    for (const action of actions) {
      const controllers = actionControllerMap.get(action);
      if (controllers && controllers.length > 0) {
        assignment.set(action, controllers[0]);
      }
    }
    assignments.push(assignment);
    
    return assignments;
  }

  private static areUCCAsEquivalent(
    ucca1: PotentialUCCA,
    ucca2: PotentialUCCA,
    interchangeableControllers: InterchangeableControllers
  ): boolean {
    if (ucca1.type !== ucca2.type || ucca1.abstraction !== ucca2.abstraction) {
      return false;
    }
    
    // Check if the controller sets are equivalent under interchangeable groups
    const controllers1 = new Set(ucca1.combinations.map(c => c.controllerId));
    const controllers2 = new Set(ucca2.combinations.map(c => c.controllerId));
    
    // Simple equivalence check (can be enhanced with full interchangeable logic)
    return controllers1.size === controllers2.size && 
           Array.from(controllers1).every(c => controllers2.has(c));
  }

  private static applySpecialInteractions(
    uccas: PotentialUCCA[],
    specialInteractions: SpecialInteractions
  ): PotentialUCCA[] {
    let result = [...uccas];
    
    // Add mandatory UCCAs
    result.push(...specialInteractions.mandatoryUCCAs);
    
    // Remove excluded UCCAs
    result = result.filter(ucca => 
      !specialInteractions.excludedUCCAs.some(excluded => 
        this.areUCCAsEquivalent(ucca, excluded, { groups: [] })
      )
    );
    
    // Apply priority adjustments
    result = result.map(ucca => ({
      ...ucca,
      riskScore: ucca.riskScore + (specialInteractions.priorityAdjustments.get(ucca.description) || 0)
    }));
    
    return result;
  }
}