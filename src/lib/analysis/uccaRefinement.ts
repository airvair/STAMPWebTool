import {
  UCCA,
  AbstractUCCA,
  RefinedUCCA,
  UCCAHierarchy,
  UCCARefinementConfig,
  AuthorityRelationship,
  InterchangeableControllerGroup,
  SpecialInteraction,
  Controller,
  ControlAction,
  UCCAType
} from '@/types/types';
import { v4 as uuidv4 } from 'uuid';

export class UCCARefinementEngine {
  private config: UCCARefinementConfig;
  private controllers: Controller[];
  private controlActions: ControlAction[];
  private authorityMap: Map<string, Map<string, AuthorityRelationship>>;
  private interchangeableMap: Map<string, InterchangeableControllerGroup>;

  constructor(
    config: UCCARefinementConfig,
    controllers: Controller[],
    controlActions: ControlAction[]
  ) {
    this.config = config;
    this.controllers = controllers;
    this.controlActions = controlActions;
    
    // Build authority lookup map
    this.authorityMap = new Map();
    config.authorityRelationships.forEach(rel => {
      if (!this.authorityMap.has(rel.controllerId)) {
        this.authorityMap.set(rel.controllerId, new Map());
      }
      this.authorityMap.get(rel.controllerId)!.set(rel.controlActionId, rel);
    });

    // Build interchangeable groups lookup
    this.interchangeableMap = new Map();
    config.interchangeableGroups.forEach(group => {
      group.controllerIds.forEach(controllerId => {
        this.interchangeableMap.set(controllerId, group);
      });
    });
  }

  /**
   * Main refinement method - converts abstract UCCAs to refined ones
   */
  refineAbstractUCCAs(abstractUCCAs: AbstractUCCA[]): UCCAHierarchy[] {
    const hierarchies: UCCAHierarchy[] = [];

    abstractUCCAs.forEach(abstractUCCA => {
      const refinedUCCAs = this.generateRefinements(abstractUCCA);
      const prunedUCCAs = this.config.pruneEquivalent 
        ? this.pruneEquivalentCombinations(refinedUCCAs)
        : refinedUCCAs;
      
      const prioritizedUCCAs = this.assignPriorities(prunedUCCAs, abstractUCCA);

      const hierarchy: UCCAHierarchy = {
        abstractUCCA,
        refinedUCCAs: prioritizedUCCAs,
        totalRefined: refinedUCCAs.length,
        prunedCount: refinedUCCAs.length - prunedUCCAs.length,
        highPriorityCount: prioritizedUCCAs.filter(u => u.priority === 'High').length
      };

      hierarchies.push(hierarchy);
    });

    return hierarchies;
  }

  /**
   * Generate all possible refined combinations from an abstract UCCA
   */
  private generateRefinements(abstractUCCA: AbstractUCCA): RefinedUCCA[] {
    const refinements: RefinedUCCA[] = [];
    
    // Parse the abstract pattern to identify involved actions
    const involvedActions = this.parseAbstractPattern(abstractUCCA);
    
    if (abstractUCCA.abstractionLevel === '2a') {
      // Team-level abstraction - enumerate controller combinations
      refinements.push(...this.generateTeamLevelRefinements(abstractUCCA, involvedActions));
    } else {
      // Controller-specific abstraction - use specified controllers
      refinements.push(...this.generateControllerSpecificRefinements(abstractUCCA, involvedActions));
    }

    return refinements;
  }

  /**
   * Parse abstract pattern to extract action requirements
   */
  private parseAbstractPattern(abstractUCCA: AbstractUCCA): ActionRequirement[] {
    const requirements: ActionRequirement[] = [];
    const pattern = abstractUCCA.abstractPattern || '';
    
    // Simple pattern parsing - in real implementation would be more sophisticated
    // Examples: "¬A ∧ B", "A ∧ any of {B, C}", etc.
    
    // Extract negated actions (¬A)
    const negatedMatches = pattern.match(/¬(\w+)/g);
    negatedMatches?.forEach(match => {
      const actionName = match.replace('¬', '');
      const action = this.controlActions.find(a => a.name === actionName || a.id === actionName);
      if (action) {
        requirements.push({ actionId: action.id, required: false });
      }
    });

    // Extract required actions
    const requiredMatches = pattern.match(/(?<!¬)\b(\w+)\b(?!\s*[{}])/g);
    requiredMatches?.forEach(match => {
      const action = this.controlActions.find(a => a.name === match || a.id === match);
      if (action) {
        requirements.push({ actionId: action.id, required: true });
      }
    });

    // Extract "any of" sets
    const anyOfMatch = pattern.match(/any\s+of\s*\{([^}]+)\}/);
    if (anyOfMatch) {
      const actionNames = anyOfMatch[1].split(',').map(s => s.trim());
      const relevantActionIds = abstractUCCA.relevantActions || [];
      
      actionNames.forEach(name => {
        const action = this.controlActions.find(a => a.name === name || a.id === name);
        if (action && relevantActionIds.includes(action.id)) {
          requirements.push({ actionId: action.id, required: true, isFromSet: true });
        }
      });
    }

    return requirements;
  }

  /**
   * Generate team-level refinements (abstraction 2a)
   */
  private generateTeamLevelRefinements(
    abstractUCCA: AbstractUCCA, 
    actionRequirements: ActionRequirement[]
  ): RefinedUCCA[] {
    const refinements: RefinedUCCA[] = [];
    
    // Get all possible controller combinations based on authority
    const controllerCombinations = this.generateControllerCombinations(actionRequirements);
    
    controllerCombinations.forEach(combination => {
      // Check if combination satisfies authority constraints
      if (!this.checkAuthorityConstraints(combination)) {
        return;
      }

      // Check special interactions
      if (!this.checkSpecialInteractions(combination, abstractUCCA)) {
        return;
      }

      const refinedUCCA: RefinedUCCA = {
        id: uuidv4(),
        code: this.generateRefinedCode(abstractUCCA, combination),
        description: this.generateRefinedDescription(abstractUCCA, combination),
        context: abstractUCCA.context,
        hazardIds: abstractUCCA.hazardIds,
        uccaType: abstractUCCA.uccaType,
        involvedControllerIds: [...new Set(combination.map(c => c.controllerId))],
        parentAbstractUCCAId: abstractUCCA.id,
        specificControllerAssignments: combination,
        priority: 'Medium', // Will be updated later
        temporalRelationship: abstractUCCA.temporalRelationship
      };

      refinements.push(refinedUCCA);
    });

    return refinements;
  }

  /**
   * Generate controller-specific refinements (abstraction 2b)
   */
  private generateControllerSpecificRefinements(
    abstractUCCA: AbstractUCCA,
    actionRequirements: ActionRequirement[]
  ): RefinedUCCA[] {
    const refinements: RefinedUCCA[] = [];
    
    // Use specified controllers from abstract UCCA
    const involvedControllers = abstractUCCA.involvedControllerIds;
    
    // For each action requirement, assign to appropriate controllers
    const assignments: ControllerAssignment[] = [];
    
    actionRequirements.forEach(req => {
      // Find controllers with authority for this action
      const authorizedControllers = involvedControllers.filter(controllerId => {
        const auth = this.authorityMap.get(controllerId)?.get(req.actionId);
        return auth && auth.hasAuthority;
      });

      if (req.required && authorizedControllers.length > 0) {
        // For required actions, create assignment for each authorized controller
        authorizedControllers.forEach(controllerId => {
          assignments.push({
            controllerId,
            controlActionId: req.actionId,
            performed: true
          });
        });
      } else if (!req.required) {
        // For negated actions, ensure no controller performs it
        involvedControllers.forEach(controllerId => {
          assignments.push({
            controllerId,
            controlActionId: req.actionId,
            performed: false
          });
        });
      }
    });

    if (assignments.length > 0) {
      const refinedUCCA: RefinedUCCA = {
        id: uuidv4(),
        code: this.generateRefinedCode(abstractUCCA, assignments),
        description: this.generateRefinedDescription(abstractUCCA, assignments),
        context: abstractUCCA.context,
        hazardIds: abstractUCCA.hazardIds,
        uccaType: abstractUCCA.uccaType,
        involvedControllerIds: abstractUCCA.involvedControllerIds,
        parentAbstractUCCAId: abstractUCCA.id,
        specificControllerAssignments: assignments,
        priority: 'Medium',
        temporalRelationship: abstractUCCA.temporalRelationship
      };

      refinements.push(refinedUCCA);
    }

    return refinements;
  }

  /**
   * Generate all possible controller combinations for given actions
   */
  private generateControllerCombinations(
    actionRequirements: ActionRequirement[]
  ): ControllerAssignment[][] {
    const combinations: ControllerAssignment[][] = [];
    
    // This is a simplified version - full implementation would handle
    // complex combinatorial generation
    
    // For each action, find controllers that can perform it
    const actionControllerMap = new Map<string, string[]>();
    
    actionRequirements.forEach(req => {
      const authorizedControllers = this.controllers
        .filter(controller => {
          const auth = this.authorityMap.get(controller.id)?.get(req.actionId);
          return auth && auth.hasAuthority;
        })
        .map(c => c.id);
      
      actionControllerMap.set(req.actionId, authorizedControllers);
    });

    // Generate combinations (simplified for brevity)
    // In full implementation, this would generate all valid combinations
    const sampleCombination: ControllerAssignment[] = [];
    
    actionRequirements.forEach(req => {
      const controllers = actionControllerMap.get(req.actionId) || [];
      if (controllers.length > 0) {
        sampleCombination.push({
          controllerId: controllers[0],
          controlActionId: req.actionId,
          performed: req.required
        });
      }
    });

    if (sampleCombination.length > 0) {
      combinations.push(sampleCombination);
    }

    return combinations;
  }

  /**
   * Check if controller assignments satisfy authority constraints
   */
  private checkAuthorityConstraints(assignments: ControllerAssignment[]): boolean {
    for (const assignment of assignments) {
      const auth = this.authorityMap.get(assignment.controllerId)?.get(assignment.controlActionId);
      
      if (!auth) {
        // No authority defined
        if (!this.config.includePartialAuthority) {
          return false;
        }
      } else if (!auth.hasAuthority && assignment.performed) {
        // Controller doesn't have authority but is assigned to perform action
        return false;
      } else if (auth.constraints && auth.constraints.length > 0) {
        // Has constraints - would need to evaluate them
        // For now, we'll assume constraints are satisfied
      }
    }
    
    return true;
  }

  /**
   * Check special interactions
   */
  private checkSpecialInteractions(
    assignments: ControllerAssignment[],
    abstractUCCA: AbstractUCCA
  ): boolean {
    const relevantInteractions = this.config.specialInteractions.filter(interaction => {
      // Check if interaction applies to this UCCA type
      if (interaction.appliesTo !== 'Both' && 
          !this.matchesUCCAType(abstractUCCA.uccaType, interaction.appliesTo)) {
        return false;
      }
      
      // Check if controllers/actions match
      const involvedControllers = new Set(assignments.map(a => a.controllerId));
      const involvedActions = new Set(assignments.map(a => a.controlActionId));
      
      if (interaction.involvedControllerIds) {
        const hasController = interaction.involvedControllerIds.some(id => involvedControllers.has(id));
        if (!hasController) return false;
      }
      
      if (interaction.involvedControlActionIds) {
        const hasAction = interaction.involvedControlActionIds.some(id => involvedActions.has(id));
        if (!hasAction) return false;
      }
      
      return true;
    });

    // Check mandatory interactions
    const mandatoryViolation = relevantInteractions.some(interaction => 
      interaction.type === 'Mandatory' && !this.satisfiesMandatory(interaction, assignments)
    );
    if (mandatoryViolation) return false;

    // Check prohibited interactions
    const prohibitedViolation = relevantInteractions.some(interaction =>
      interaction.type === 'Prohibited' && this.violatesProhibited(interaction, assignments)
    );
    if (prohibitedViolation) return false;

    return true;
  }

  /**
   * Prune equivalent combinations based on interchangeable controllers
   */
  private pruneEquivalentCombinations(refinedUCCAs: RefinedUCCA[]): RefinedUCCA[] {
    const pruned: RefinedUCCA[] = [];
    const seen = new Set<string>();

    refinedUCCAs.forEach(ucca => {
      const signature = this.generateEquivalenceSignature(ucca);
      
      if (!seen.has(signature)) {
        seen.add(signature);
        pruned.push(ucca);
      } else {
        // Mark as pruned
        ucca.isPruned = true;
        ucca.pruneReason = 'Equivalent to another combination due to interchangeable controllers';
        pruned.push(ucca); // Still include but marked as pruned
      }
    });

    return pruned;
  }

  /**
   * Generate equivalence signature for deduplication
   */
  private generateEquivalenceSignature(ucca: RefinedUCCA): string {
    // Group assignments by interchangeable groups
    const normalizedAssignments = ucca.specificControllerAssignments.map(assignment => {
      const group = this.interchangeableMap.get(assignment.controllerId);
      const groupId = group?.id || assignment.controllerId;
      return `${groupId}:${assignment.controlActionId}:${assignment.performed}`;
    });

    // Sort to ensure consistent ordering
    normalizedAssignments.sort();
    
    return normalizedAssignments.join('|');
  }

  /**
   * Assign priorities based on special interactions and risk factors
   */
  private assignPriorities(
    refinedUCCAs: RefinedUCCA[],
    abstractUCCA: AbstractUCCA
  ): RefinedUCCA[] {
    return refinedUCCAs.map(ucca => {
      if (ucca.isPruned) {
        return ucca; // Don't prioritize pruned items
      }

      let priorityScore = 5; // Default medium

      // Check special interactions for priority adjustments
      this.config.specialInteractions.forEach(interaction => {
        if (interaction.type === 'Priority' && this.matchesInteraction(ucca, interaction)) {
          priorityScore = Math.max(priorityScore, interaction.priority || 5);
        }
      });

      // Adjust based on number of controllers involved
      if (ucca.involvedControllerIds.length > 3) {
        priorityScore += 1;
      }

      // Adjust based on hazard count
      if (ucca.hazardIds.length > 1) {
        priorityScore += 1;
      }

      // Temporal UCCAs often higher priority
      if (ucca.uccaType === UCCAType.Temporal) {
        priorityScore += 1;
      }

      // Convert score to priority level
      ucca.priorityScore = priorityScore;
      if (priorityScore >= 8) {
        ucca.priority = 'High';
      } else if (priorityScore >= 5) {
        ucca.priority = 'Medium';
      } else {
        ucca.priority = 'Low';
      }

      return ucca;
    });
  }

  /**
   * Generate refined UCCA code
   */
  private generateRefinedCode(
    abstractUCCA: AbstractUCCA,
    assignments: ControllerAssignment[]
  ): string {
    const parentCode = abstractUCCA.code;
    const controllerCodes = [...new Set(assignments.map(a => {
      const controller = this.controllers.find(c => c.id === a.controllerId);
      return controller?.name.substring(0, 3).toUpperCase() || 'UNK';
    }))].join('-');
    
    return `${parentCode}-R-${controllerCodes}`;
  }

  /**
   * Generate refined description
   */
  private generateRefinedDescription(
    abstractUCCA: AbstractUCCA,
    assignments: ControllerAssignment[]
  ): string {
    const parts: string[] = [];
    
    // Group by action
    const actionGroups = new Map<string, ControllerAssignment[]>();
    assignments.forEach(assignment => {
      if (!actionGroups.has(assignment.controlActionId)) {
        actionGroups.set(assignment.controlActionId, []);
      }
      actionGroups.get(assignment.controlActionId)!.push(assignment);
    });

    actionGroups.forEach((assignments, actionId) => {
      const action = this.controlActions.find(a => a.id === actionId);
      const actionName = action?.name || 'unknown action';
      
      const performers = assignments.filter(a => a.performed);
      const nonPerformers = assignments.filter(a => !a.performed);
      
      if (performers.length > 0) {
        const controllerNames = performers.map(a => 
          this.controllers.find(c => c.id === a.controllerId)?.name || 'Unknown'
        ).join(' and ');
        parts.push(`${controllerNames} provide${performers.length === 1 ? 's' : ''} ${actionName}`);
      }
      
      if (nonPerformers.length > 0) {
        const controllerNames = nonPerformers.map(a => 
          this.controllers.find(c => c.id === a.controllerId)?.name || 'Unknown'
        ).join(' and ');
        parts.push(`${controllerNames} do${nonPerformers.length === 1 ? 'es' : ''} not provide ${actionName}`);
      }
    });

    return parts.join(' while ') + ` ${abstractUCCA.context}`;
  }

  // Helper methods
  private matchesUCCAType(uccaType: UCCAType, appliesTo: 'Type1-2' | 'Type3-4'): boolean {
    if (appliesTo === 'Type1-2') {
      return uccaType === UCCAType.TeamBased || uccaType === UCCAType.CrossController;
    } else {
      return uccaType === UCCAType.Temporal;
    }
  }

  private satisfiesMandatory(interaction: SpecialInteraction, assignments: ControllerAssignment[]): boolean {
    // Implementation would check if mandatory conditions are satisfied
    return true;
  }

  private violatesProhibited(interaction: SpecialInteraction, assignments: ControllerAssignment[]): boolean {
    // Implementation would check if prohibited combinations exist
    return false;
  }

  private matchesInteraction(ucca: RefinedUCCA, interaction: SpecialInteraction): boolean {
    // Check if UCCA matches interaction criteria
    const controllerMatch = !interaction.involvedControllerIds || 
      interaction.involvedControllerIds.some(id => ucca.involvedControllerIds.includes(id));
    
    const actionMatch = !interaction.involvedControlActionIds ||
      interaction.involvedControlActionIds.some(id => 
        ucca.specificControllerAssignments.some(a => a.controlActionId === id)
      );
    
    return controllerMatch && actionMatch;
  }
}

interface ActionRequirement {
  actionId: string;
  required: boolean;
  isFromSet?: boolean;
}

interface ControllerAssignment {
  controllerId: string;
  controlActionId: string;
  performed: boolean;
}