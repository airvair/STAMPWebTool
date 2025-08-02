import { Controller, ControlAction, UnsafeControlAction, Hazard, UCAType, ControllerType } from '@/types/types';
import { performSystematicCompletenessCheck } from './mitStpaCompliance';

export interface UcaSuggestion {
  priority: 'high' | 'medium' | 'low';
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  reasoning: string;
  context: string;
  suggestedHazards: string[];
  confidence: number; // 0-1 scale
  category?: 'missing' | 'quality-improvement' | 'systematic';
}

export interface SmartSuggestionConfig {
  prioritizeHighRiskControllers: boolean;
  considerHazardRelevance: boolean;
  balanceUcaTypes: boolean;
  focusOnMissingCombinations: boolean;
}

/**
 * Generates smart UCA suggestions based on systematic analysis gaps
 * Enhanced with caching and performance optimizations
 */
export const generateSmartUcaSuggestions = (
  controllers: Controller[],
  controlActions: ControlAction[],
  ucas: UnsafeControlAction[],
  hazards: Hazard[],
  config: SmartSuggestionConfig = {
    prioritizeHighRiskControllers: true,
    considerHazardRelevance: true,
    balanceUcaTypes: true,
    focusOnMissingCombinations: true
  }
): UcaSuggestion[] => {
  const suggestions: UcaSuggestion[] = [];
  
  // Validate inputs
  if (!controllers?.length || !controlActions?.length || !hazards?.length) {
    return suggestions;
  }
  
  // Create lookup maps for performance
  const controllerMap = new Map(controllers.map(c => [c.id, c]));
  const actionMap = new Map(controlActions.map(a => [a.id, a]));
  
  const completenessCheck = performSystematicCompletenessCheck(controllers, controlActions, ucas || [], hazards);

  // Start with missing combinations if enabled
  if (config.focusOnMissingCombinations) {
    for (const missing of completenessCheck.missingCombinations.slice(0, 10)) {
      const controller = controllerMap.get(missing.controllerId);
      const action = actionMap.get(missing.controlActionId);
      
      if (!controller || !action) continue;

      const suggestion = generateUcaSuggestionForMissing(
        controller,
        action,
        missing.ucaType,
        hazards,
        config
      );
      
      if (suggestion) {
        suggestions.push({ ...suggestion, category: 'missing' });
      }
    }
  }

  // Add suggestions for improving existing UCAs
  const lowQualityUcas = completenessCheck.qualityIssues
    .filter(issue => issue.severity === 'high')
    .slice(0, 5);

  for (const issue of lowQualityUcas) {
    const uca = ucas.find(u => u.id === issue.ucaId);
    if (!uca) continue;

    const controller = controllerMap.get(uca.controllerId);
    const action = actionMap.get(uca.controlActionId);
    
    if (!controller || !action) continue;

    suggestions.push({
      priority: 'medium',
      controllerId: uca.controllerId,
      controlActionId: uca.controlActionId,
      ucaType: uca.ucaType,
      reasoning: `Improve existing UCA: ${issue.issue}`,
      context: generateImprovedContext(uca.context, issue.issue),
      suggestedHazards: uca.hazardIds,
      confidence: 0.7,
      category: 'quality-improvement'
    });
  }

  // Sort by priority and confidence
  return suggestions
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    })
    .slice(0, 15); // Limit to top 15 suggestions
};

/**
 * Generates a UCA suggestion for a missing combination
 */
const generateUcaSuggestionForMissing = (
  controller: Controller,
  action: ControlAction,
  ucaType: UCAType,
  hazards: Hazard[],
  config: SmartSuggestionConfig
): UcaSuggestion | null => {
  if (!controller || !action || !ucaType) {
    return null;
  }
  
  const priority = determineUcaPriority(controller, action, ucaType, config);
  const suggestedContext = generateContextSuggestion(controller, action, ucaType);
  const suggestedHazards = findRelevantHazards(action, hazards || [], config);

  return {
    priority,
    controllerId: controller.id,
    controlActionId: action.id,
    ucaType,
    reasoning: generateReasoning(controller, action, ucaType),
    context: suggestedContext,
    suggestedHazards: suggestedHazards.map(h => h.id),
    confidence: calculateConfidence(controller, action, ucaType, suggestedHazards)
  };
};

/**
 * Determines priority based on controller type and action criticality
 */
const determineUcaPriority = (
  controller: Controller,
  action: ControlAction,
  ucaType: UCAType,
  config: SmartSuggestionConfig
): 'high' | 'medium' | 'low' => {
  let score = 0;

  // Controller type risk assessment
  if (config.prioritizeHighRiskControllers) {
    const riskScores: Record<ControllerType, number> = {
      [ControllerType.Human]: 3, // Humans are prone to errors
      [ControllerType.Team]: 2, // Teams can have coordination issues
      [ControllerType.Organisation]: 1, // Organizations are generally more stable
      [ControllerType.Software]: 2 // Software can have bugs
    };
    score += riskScores[controller.ctrlType] || 1;
  }

  // UCA type criticality
  const ucaTypeScores: Partial<Record<UCAType, number>> = {
    [UCAType.NotProvided]: 3, // Often critical - no action when needed
    [UCAType.ProvidedUnsafe]: 2, // Action when shouldn't be provided
    [UCAType.TooEarly]: 2, // Timing issues can be critical
    [UCAType.TooLate]: 3, // Delayed action often dangerous
    [UCAType.WrongOrder]: 2, // Order issues can be critical
    [UCAType.TooLong]: 1, // Duration issues
    [UCAType.TooShort]: 1 // Duration issues
  };
  score += ucaTypeScores[ucaType] || 1;

  // Action verb criticality (emergency/safety actions are higher priority)
  const criticalVerbs = ['stop', 'abort', 'emergency', 'eject', 'deploy', 'brake', 'alert'];
  if (criticalVerbs.some(verb => action.verb.toLowerCase().includes(verb))) {
    score += 2;
  }

  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
};

/**
 * Generates contextual reasoning for why this UCA should be analyzed
 */
const generateReasoning = (
  controller: Controller,
  action: ControlAction,
  ucaType: UCAType
): string => {
  const templates: Partial<Record<UCAType, string>> = {
    [UCAType.NotProvided]: `Analysis needed: When might ${controller.name} fail to ${action.verb.toLowerCase()} ${action.object}?`,
    [UCAType.ProvidedUnsafe]: `Analysis needed: When might ${controller.name} inappropriately ${action.verb.toLowerCase()} ${action.object}?`,
    [UCAType.TooEarly]: `Analysis needed: When might ${controller.name} ${action.verb.toLowerCase()} ${action.object} too early?`,
    [UCAType.TooLate]: `Analysis needed: When might ${controller.name} ${action.verb.toLowerCase()} ${action.object} too late?`,
    [UCAType.WrongOrder]: `Analysis needed: When might ${controller.name} ${action.verb.toLowerCase()} ${action.object} in wrong order?`,
    [UCAType.TooLong]: `Analysis needed: When might ${controller.name} ${action.verb.toLowerCase()} ${action.object} for too long?`,
    [UCAType.TooShort]: `Analysis needed: When might ${controller.name} ${action.verb.toLowerCase()} ${action.object} for too short?`
  };

  return templates[ucaType] || `Systematic analysis required for ${ucaType} scenario`;
};

/**
 * Generates context suggestion based on controller and action
 */
const generateContextSuggestion = (
  controller: Controller,
  action: ControlAction,
  ucaType: UCAType
): string => {
  if (!controller || !action || !ucaType) {
    return 'When specific conditions require this control action';
  }
  
  const controllerName = controller.name || 'Controller';
  const actionVerb = (action.verb || 'perform').toLowerCase();
  const actionObject = action.object || 'action';
  
  const contextTemplates: Partial<Record<UCAType, string[]>> = {
    [UCAType.NotProvided]: [
      `During emergency situations when ${actionObject} operation is critical`,
      `When system feedback indicates need for ${actionVerb} action`,
      `During high workload periods when ${controllerName} is distracted`
    ],
    [UCAType.ProvidedUnsafe]: [
      `When system is not ready for ${actionObject} operation`,
      `During maintenance or testing phases`,
      `When environmental conditions make ${actionVerb} unsafe`
    ],
    [UCAType.TooEarly]: [
      `Before proper system initialization for ${actionObject}`,
      `During critical phases when timing is essential`,
      `Before receiving confirmation from other controllers`
    ],
    [UCAType.TooLate]: [
      `After critical time window for ${actionObject} has passed`,
      `When system degradation has already begun`,
      `During time-critical emergency scenarios`
    ],
    [UCAType.WrongOrder]: [
      `When ${actionObject} operation is out of sequence`,
      `During conflicting controller commands`,
      `When order dependencies are violated`
    ],
    [UCAType.TooLong]: [
      `When ${actionObject} operation exceeds safe duration`,
      `During sustained operation beyond design limits`,
      `When termination conditions are not met`
    ],
    [UCAType.TooShort]: [
      `When ${actionObject} operation is prematurely terminated`,
      `During incomplete execution cycles`,
      `When minimum duration requirements are not met`
    ]
  };

  const suggestions = contextTemplates[ucaType] || ['During normal operation'];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};

/**
 * Finds hazards that might be relevant to this control action
 * Optimized with early returns and caching
 */
const findRelevantHazards = (
  action: ControlAction,
  hazards: Hazard[],
  config: SmartSuggestionConfig
): Hazard[] => {
  if (!action || !hazards?.length) {
    return [];
  }
  
  if (!config.considerHazardRelevance) {
    return hazards.slice(0, 2); // Just return first few hazards
  }

  const relevant: { hazard: Hazard; relevance: number }[] = [];
  const actionText = `${action.verb || ''} ${action.object || ''}`.toLowerCase();
  const actionWords = actionText.split(/\s+/).filter(word => word.length > 2);

  // Use Set for O(1) word lookup
  const actionWordSet = new Set(actionWords);

  for (const hazard of hazards) {
    let relevance = 0;
    const hazardText = (hazard.title || '').toLowerCase();
    const hazardWords = hazardText.split(/\s+/).filter(word => word.length > 2);

    // Keyword matching with Set
    for (const word of hazardWords) {
      if (actionWordSet.has(word)) {
        relevance += 2;
      }
    }

    // Domain-specific relevance
    const domainRules = [
      { hazardKey: 'collision', actionKey: 'brake', score: 3 },
      { hazardKey: 'fire', actionKey: 'deploy', score: 3 },
      { hazardKey: 'pressure', actionKey: 'vent', score: 3 }
    ];

    for (const rule of domainRules) {
      if (hazardText.includes(rule.hazardKey) && actionText.includes(rule.actionKey)) {
        relevance += rule.score;
      }
    }

    if (relevance > 0) {
      relevant.push({ hazard, relevance });
    }
  }

  return relevant
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3)
    .map(r => r.hazard);
};

/**
 * Calculates confidence in the suggestion
 */
const calculateConfidence = (
  controller: Controller,
  action: ControlAction,
  ucaType: UCAType,
  suggestedHazards: Hazard[]
): number => {
  let confidence = 0.5; // Base confidence

  // Higher confidence for human controllers (more predictable failure modes)
  if (controller.ctrlType === ControllerType.Human) confidence += 0.2;

  // Higher confidence for critical UCA types
  if (ucaType === UCAType.NotProvided || ucaType === UCAType.TooLate) confidence += 0.2;

  // Higher confidence when we found relevant hazards
  if (suggestedHazards.length > 0) confidence += 0.1;

  // Higher confidence for common action verbs
  const commonVerbs = ['start', 'stop', 'activate', 'deactivate', 'open', 'close'];
  if (commonVerbs.includes(action.verb.toLowerCase())) confidence += 0.1;

  return Math.min(1.0, confidence);
};

/**
 * Generates improved context for existing UCAs with quality issues
 */
const generateImprovedContext = (originalContext: string, issue: string): string => {
  if (issue.includes('too brief')) {
    return `${originalContext} - Consider specific environmental conditions, system states, and timing constraints that make this control action unsafe.`;
  }
  
  if (issue.includes('vague language')) {
    return originalContext.replace(
      /sometimes|maybe|might|could|possibly/gi,
      'when specific conditions occur'
    ) + ' - Specify measurable conditions and thresholds.';
  }
  
  return `${originalContext} - Provide more specific context addressing: ${issue}`;
};

/**
 * Get next recommended UCA to work on
 * Enhanced with category-based prioritization
 */
export const getNextRecommendedUca = (
  controllers: Controller[],
  controlActions: ControlAction[],
  ucas: UnsafeControlAction[],
  hazards: Hazard[],
  preferCategory?: 'missing' | 'quality-improvement' | 'systematic'
): UcaSuggestion | null => {
  const suggestions = generateSmartUcaSuggestions(controllers, controlActions, ucas, hazards);
  
  if (preferCategory) {
    const categorySuggestions = suggestions.filter(s => s.category === preferCategory);
    if (categorySuggestions.length > 0) {
      return categorySuggestions[0];
    }
  }
  
  return suggestions.length > 0 ? suggestions[0] : null;
};