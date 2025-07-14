import { Controller, ControlAction, UnsafeControlAction, UCCA, UCCAType } from '@/types';

export type AuthorityTuple = [string, string]; // [Superior, Subordinate]

export enum UCCAAlgorithmType {
  Standard = 'Standard',
  Enhanced = 'Enhanced',
  Custom = 'Custom',
}

export enum AbstractionLevel {
  Abstraction2a = '2a',
  Abstraction2b = '2b',
}

export interface InterchangeableControllers {
  groupId: string;
  controllerIds: string[];
}

export interface SpecialInteractions {
  interactionId: string;
  controlActionIds: string[];
  description: string;
}

export interface PotentialUCCA {
  id: string;
  controllerIds: string[];
  controlActionIds: string[];
  combinationType: 'provide-not-provide' | 'temporal' | 'hierarchical';
  abstractionLevel: '2a' | '2b'; // Team-level vs Controller-specific
  description: string;
  pattern: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export class UCCAIdentificationAlgorithm {
  private controllers: Controller[];
  private controlActions: ControlAction[];
  private existingUCAs: UnsafeControlAction[];

  constructor(
    controllers: Controller[],
    controlActions: ControlAction[],
    existingUCAs: UnsafeControlAction[]
  ) {
    this.controllers = controllers;
    this.controlActions = controlActions;
    this.existingUCAs = existingUCAs;
  }

  /**
   * Main enumeration method that identifies potential UCCAs
   * Based on Kopeikin thesis section 4.3
   */
  public enumerateControlActionCombinations(
    abstractionLevel: '2a' | '2b',
    maxControllers: number = 3
  ): PotentialUCCA[] {
    const potentialUCCAs: PotentialUCCA[] = [];
    
    // Type 1-2: Provide/Not-Provide combinations
    potentialUCCAs.push(...this.identifyProvideNotProvideCombinations(abstractionLevel, maxControllers));
    
    // Type 3-4: Temporal combinations
    potentialUCCAs.push(...this.identifyTemporalCombinations(abstractionLevel, maxControllers));
    
    // Hierarchical combinations
    potentialUCCAs.push(...this.identifyHierarchicalCombinations(abstractionLevel));
    
    return this.rankByRiskPotential(potentialUCCAs);
  }

  /**
   * Type 1-2: One controller provides while another doesn't
   * Most common UCCA pattern
   */
  private identifyProvideNotProvideCombinations(
    abstractionLevel: '2a' | '2b',
    maxControllers: number
  ): PotentialUCCA[] {
    const combinations: PotentialUCCA[] = [];
    
    // Get controller pairs/groups based on abstraction level
    const controllerGroups = this.getControllerGroups(abstractionLevel, 2, maxControllers);
    
    for (const group of controllerGroups) {
      // Find control actions that could conflict
      const sharedTargets = this.findSharedControlTargets(group);
      
      for (const target of sharedTargets) {
        const actions = this.getActionsForTarget(group, target);
        
        // Generate combinations where one provides and another doesn't
        for (let i = 0; i < actions.length; i++) {
          for (let j = i + 1; j < actions.length; j++) {
            const combination: PotentialUCCA = {
              id: `PUCCA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              controllerIds: [actions[i].controllerId, actions[j].controllerId],
              controlActionIds: [actions[i].id, actions[j].id],
              combinationType: 'provide-not-provide',
              abstractionLevel,
              description: `${this.getControllerName(actions[i].controllerId)} provides "${actions[i].verb} ${actions[i].object}" while ${this.getControllerName(actions[j].controllerId)} does not provide "${actions[j].verb} ${actions[j].object}"`,
              pattern: 'Conflicting control actions on shared target',
              riskLevel: this.assessRiskLevel(actions[i], actions[j])
            };
            
            combinations.push(combination);
          }
        }
      }
    }
    
    return combinations;
  }

  /**
   * Type 3-4: Temporal combinations (too early/late relative to each other)
   */
  private identifyTemporalCombinations(
    abstractionLevel: '2a' | '2b',
    maxControllers: number
  ): PotentialUCCA[] {
    const combinations: PotentialUCCA[] = [];
    
    const controllerGroups = this.getControllerGroups(abstractionLevel, 2, maxControllers);
    
    for (const group of controllerGroups) {
      // Find actions that have temporal dependencies
      const sequentialActions = this.findSequentialActions(group);
      
      for (const sequence of sequentialActions) {
        const combination: PotentialUCCA = {
          id: `PUCCA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          controllerIds: sequence.map(a => a.controllerId),
          controlActionIds: sequence.map(a => a.id),
          combinationType: 'temporal',
          abstractionLevel,
          description: `Timing conflict: ${sequence.map((a, i) => 
            `${this.getControllerName(a.controllerId)} ${a.verb} ${a.object}${i < sequence.length - 1 ? ' before' : ''}`
          ).join(' ')}`,
          pattern: 'Temporal ordering violation',
          riskLevel: 'medium'
        };
        
        combinations.push(combination);
      }
    }
    
    return combinations;
  }

  /**
   * Hierarchical combinations based on authority levels
   */
  private identifyHierarchicalCombinations(
    abstractionLevel: '2a' | '2b'
  ): PotentialUCCA[] {
    const combinations: PotentialUCCA[] = [];
    
    // Find controllers with hierarchical relationships
    const hierarchicalPairs = this.findHierarchicalPairs();
    
    for (const [superior, subordinate] of hierarchicalPairs) {
      // Find potentially conflicting commands
      const superiorActions = this.controlActions.filter(a => a.controllerId === superior.id);
      const subordinateActions = this.controlActions.filter(a => a.controllerId === subordinate.id);
      
      for (const supAction of superiorActions) {
        for (const subAction of subordinateActions) {
          if (this.canConflict(supAction, subAction)) {
            const combination: PotentialUCCA = {
              id: `PUCCA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              controllerIds: [superior.id, subordinate.id],
              controlActionIds: [supAction.id, subAction.id],
              combinationType: 'hierarchical',
              abstractionLevel,
              description: `Authority conflict: ${superior.name} commands "${supAction.verb} ${supAction.object}" while ${subordinate.name} independently performs "${subAction.verb} ${subAction.object}"`,
              pattern: 'Hierarchical command conflict',
              riskLevel: 'high'
            };
            
            combinations.push(combination);
          }
        }
      }
    }
    
    return combinations;
  }

  /**
   * Helper methods
   */
  
  private getControllerGroups(
    abstractionLevel: '2a' | '2b',
    minSize: number,
    maxSize: number
  ): Controller[][] {
    if (abstractionLevel === '2a') {
      // Team-level abstraction - group by team
      return this.groupControllersByTeam(minSize, maxSize);
    } else {
      // Controller-specific - all combinations
      return this.getAllControllerCombinations(minSize, maxSize);
    }
  }

  private groupControllersByTeam(minSize: number, maxSize: number): Controller[][] {
    const teams = new Map<string, Controller[]>();
    
    // Group controllers by team or organizational unit
    this.controllers.forEach(controller => {
      const teamKey = controller.ctrlType === 'T' ? controller.id : 
                     controller.parentNode || 'ungrouped';
      
      if (!teams.has(teamKey)) {
        teams.set(teamKey, []);
      }
      teams.get(teamKey)!.push(controller);
    });
    
    // Return teams that meet size requirements
    return Array.from(teams.values()).filter(
      team => team.length >= minSize && team.length <= maxSize
    );
  }

  private getAllControllerCombinations(minSize: number, maxSize: number): Controller[][] {
    const combinations: Controller[][] = [];
    
    // Generate all combinations of controllers
    for (let size = minSize; size <= Math.min(maxSize, this.controllers.length); size++) {
      combinations.push(...this.getCombinations(this.controllers, size));
    }
    
    return combinations;
  }

  private getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 1) return arr.map(el => [el]);
    
    const combinations: T[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const head = arr.slice(i, i + 1);
      const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
      for (const tail of tailCombinations) {
        combinations.push([...head, ...tail]);
      }
    }
    
    return combinations;
  }

  private findSharedControlTargets(controllers: Controller[]): string[] {
    const targetMap = new Map<string, number>();
    
    controllers.forEach(controller => {
      const actions = this.controlActions.filter(a => a.controllerId === controller.id);
      actions.forEach(action => {
        const target = action.object;
        targetMap.set(target, (targetMap.get(target) || 0) + 1);
      });
    });
    
    // Return targets that multiple controllers can affect
    return Array.from(targetMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([target, _]) => target);
  }

  private getActionsForTarget(controllers: Controller[], target: string): ControlAction[] {
    return this.controlActions.filter(
      action => controllers.some(c => c.id === action.controllerId) &&
                action.object === target
    );
  }

  private findSequentialActions(controllers: Controller[]): ControlAction[][] {
    const sequences: ControlAction[][] = [];
    
    // Look for actions that typically need to happen in sequence
    const sequentialPatterns = [
      ['activate', 'monitor'],
      ['configure', 'activate'],
      ['stop', 'restart'],
      ['initiate', 'confirm']
    ];
    
    for (const pattern of sequentialPatterns) {
      const matchingActions = controllers.map(controller => {
        return pattern.map(verb => 
          this.controlActions.find(a => 
            a.controllerId === controller.id && 
            a.verb.toLowerCase().includes(verb)
          )
        ).filter(Boolean) as ControlAction[];
      }).filter(actions => actions.length === pattern.length);
      
      if (matchingActions.length >= 2) {
        sequences.push(matchingActions.flat());
      }
    }
    
    return sequences;
  }

  private findHierarchicalPairs(): [Controller, Controller][] {
    const pairs: [Controller, Controller][] = [];
    
    for (let i = 0; i < this.controllers.length; i++) {
      for (let j = i + 1; j < this.controllers.length; j++) {
        if (this.hasHierarchicalRelationship(this.controllers[i], this.controllers[j])) {
          pairs.push([this.controllers[i], this.controllers[j]]);
        }
      }
    }
    
    return pairs;
  }

  private hasHierarchicalRelationship(c1: Controller, c2: Controller): boolean {
    // Check if one controller has authority over the other
    // This could be based on parentNode, controller type, or explicit relationships
    return (c1.parentNode === c2.id || c2.parentNode === c1.id) ||
           (c1.ctrlType === 'O' && c2.ctrlType !== 'O') ||
           (c2.ctrlType === 'O' && c1.ctrlType !== 'O');
  }

  private canConflict(a1: ControlAction, a2: ControlAction): boolean {
    // Check if two actions can potentially conflict
    return a1.object === a2.object || 
           (a1.verb === 'stop' && a2.verb === 'start') ||
           (a1.verb === 'increase' && a2.verb === 'decrease');
  }

  private getControllerName(controllerId: string): string {
    return this.controllers.find(c => c.id === controllerId)?.name || 'Unknown';
  }

  private assessRiskLevel(a1: ControlAction, a2: ControlAction): 'low' | 'medium' | 'high' {
    // Simple risk assessment based on action types
    const highRiskVerbs = ['stop', 'disable', 'override', 'emergency'];
    const mediumRiskVerbs = ['adjust', 'modify', 'change'];
    
    if (highRiskVerbs.some(v => a1.verb.includes(v) || a2.verb.includes(v))) {
      return 'high';
    }
    if (mediumRiskVerbs.some(v => a1.verb.includes(v) || a2.verb.includes(v))) {
      return 'medium';
    }
    return 'low';
  }

  private rankByRiskPotential(uccas: PotentialUCCA[]): PotentialUCCA[] {
    return uccas.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }

  /**
   * Refinement method to validate and enhance potential UCCAs
   */
  public refinePotentialUCCA(
    potential: PotentialUCCA,
    context: string,
    hazardIds: string[]
  ): Omit<UCCA, 'id'> {
    return {
      code: `UCCA-${potential.abstractionLevel.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      description: potential.description,
      context,
      hazardIds,
      uccaType: this.mapToUCCAType(potential),
      involvedControllerIds: potential.controllerIds,
      temporalRelationship: potential.combinationType === 'temporal' ? 'Sequential' : 'Simultaneous',
      isSystematic: true,
      specificCause: potential.pattern
    };
  }

  private mapToUCCAType(potential: PotentialUCCA): UCCAType {
    switch (potential.combinationType) {
      case 'hierarchical':
        return UCCAType.Organizational;
      case 'temporal':
        return UCCAType.Temporal;
      default:
        return UCCAType.CrossController;
    }
  }
}