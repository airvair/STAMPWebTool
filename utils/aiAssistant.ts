/**
 * AI-Powered Analysis Assistant for STPA
 * Provides intelligent suggestions, analysis validation, and automated insights
 */

import {
  Loss,
  Hazard,
  Controller,
  ControlAction,
  UnsafeControlAction,
  UCCA,
  CausalScenario,
  Requirement,
  UCAType,
  UCCAType
} from '../types';
import { smartContextBuilder } from './smartContextBuilder';
import { completenessChecker } from './completenessChecker';
import { riskScoringEngine } from './riskScoring';

export interface AnalysisInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'error' | 'info';
  category: InsightCategory;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedAction?: string;
  confidence: number; // 0-1
  reasoning?: string[];
}

export enum InsightCategory {
  MISSING_ELEMENTS = 'missing_elements',
  INCOMPLETE_ANALYSIS = 'incomplete_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  PATTERN_DETECTION = 'pattern_detection',
  BEST_PRACTICES = 'best_practices',
  OPTIMIZATION = 'optimization',
  CONSISTENCY = 'consistency',
  COVERAGE = 'coverage'
}

export interface AssistantContext {
  losses: Loss[];
  hazards: Hazard[];
  controllers: Controller[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  scenarios: CausalScenario[];
  requirements: Requirement[];
}

export interface AssistantCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
}

export interface AnalysisPattern {
  id: string;
  name: string;
  description: string;
  matches: (context: AssistantContext) => boolean;
  generateInsights: (context: AssistantContext) => AnalysisInsight[];
}

/**
 * AI Assistant for STPA Analysis
 */
export class AIAssistant {
  private patterns: Map<string, AnalysisPattern> = new Map();
  private capabilities: Map<string, AssistantCapability> = new Map();
  private learningData: Map<string, any> = new Map();
  
  constructor() {
    this.initializePatterns();
    this.initializeCapabilities();
  }

  /**
   * Analyze the current state and provide insights
   */
  async analyzeAndProvideInsights(context: AssistantContext): Promise<AnalysisInsight[]> {
    const insights: AnalysisInsight[] = [];

    // Check for missing elements
    insights.push(...this.checkMissingElements(context));

    // Analyze completeness
    insights.push(...this.analyzeCompleteness(context));

    // Detect patterns
    insights.push(...this.detectPatterns(context));

    // Risk assessment insights
    insights.push(...this.analyzeRisks(context));

    // Best practices
    insights.push(...this.checkBestPractices(context));

    // Coverage analysis
    insights.push(...this.analyzeCoverage(context));

    // Sort by severity and confidence
    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Generate smart suggestions for specific entity types
   */
  async generateSuggestions(
    entityType: string,
    context: AssistantContext,
    currentEntity?: any
  ): Promise<string[]> {
    const suggestions: string[] = [];

    switch (entityType) {
      case 'hazard':
        suggestions.push(...this.generateHazardSuggestions(context));
        break;
      case 'uca':
        suggestions.push(...this.generateUCASuggestions(context, currentEntity));
        break;
      case 'ucca':
        suggestions.push(...this.generateUCCASuggestions(context, currentEntity));
        break;
      case 'scenario':
        suggestions.push(...this.generateScenarioSuggestions(context, currentEntity));
        break;
      case 'requirement':
        suggestions.push(...this.generateRequirementSuggestions(context, currentEntity));
        break;
    }

    return suggestions;
  }

  /**
   * Validate an entity and provide feedback
   */
  validateEntity(entityType: string, entity: any, context: AssistantContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    // const issues: string[] = [];
    // const suggestions: string[] = [];

    switch (entityType) {
      case 'loss':
        return this.validateLoss(entity);
      case 'hazard':
        return this.validateHazard(entity, context);
      case 'uca':
        return this.validateUCA(entity, context);
      case 'ucca':
        return this.validateUCCA(entity, context);
      case 'scenario':
        return this.validateScenario(entity, context);
      case 'requirement':
        return this.validateRequirement(entity, context);
      default:
        return { isValid: true, issues: [], suggestions: [] };
    }
  }

  /**
   * Auto-complete partial entities
   */
  autoComplete(
    entityType: string,
    partialEntity: any,
    context: AssistantContext
  ): any {
    switch (entityType) {
      case 'uca':
        return this.autoCompleteUCA(partialEntity, context);
      case 'ucca':
        return this.autoCompleteUCCA(partialEntity, context);
      case 'scenario':
        return this.autoCompleteScenario(partialEntity, context);
      default:
        return partialEntity;
    }
  }

  /**
   * Learn from user actions
   */
  learnFromAction(action: {
    type: string;
    entityType: string;
    before?: any;
    after?: any;
    accepted?: boolean;
  }): void {
    // Store learning data for pattern improvement
    const key = `${action.entityType}_${action.type}`;
    const learningEntry = this.learningData.get(key) || { count: 0, patterns: [] };
    
    learningEntry.count++;
    if (action.accepted !== undefined) {
      learningEntry.patterns.push({
        timestamp: new Date(),
        accepted: action.accepted,
        data: { before: action.before, after: action.after }
      });
    }
    
    this.learningData.set(key, learningEntry);
  }

  /**
   * Private methods for specific analyses
   */
  private checkMissingElements(context: AssistantContext): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    // Check for hazards without associated losses
    const orphanedHazards = context.hazards.filter(h => !h.lossIds || h.lossIds.length === 0);
    if (orphanedHazards.length > 0) {
      insights.push({
        id: 'missing-loss-links',
        type: 'warning',
        category: InsightCategory.MISSING_ELEMENTS,
        title: 'Hazards without associated losses',
        description: `${orphanedHazards.length} hazard(s) are not linked to any losses`,
        severity: 'high',
        actionable: true,
        suggestedAction: 'Link each hazard to at least one loss',
        confidence: 1.0,
        reasoning: ['Every hazard should be traceable to at least one loss']
      });
    }

    // Check for controllers without control actions
    const inactiveControllers = context.controllers.filter(c => 
      !context.controlActions.some(ca => ca.controllerId === c.id)
    );
    if (inactiveControllers.length > 0) {
      insights.push({
        id: 'controllers-no-actions',
        type: 'warning',
        category: InsightCategory.MISSING_ELEMENTS,
        title: 'Controllers without control actions',
        description: `${inactiveControllers.length} controller(s) have no control actions defined`,
        severity: 'medium',
        actionable: true,
        suggestedAction: 'Define control actions for each controller',
        confidence: 0.9
      });
    }

    // Check for control actions without UCAs
    const unanalyzedActions = context.controlActions.filter(ca =>
      !context.ucas.some(uca => uca.controlActionId === ca.id)
    );
    if (unanalyzedActions.length > 0) {
      insights.push({
        id: 'actions-no-ucas',
        type: 'warning',
        category: InsightCategory.MISSING_ELEMENTS,
        title: 'Control actions without UCA analysis',
        description: `${unanalyzedActions.length} control action(s) have not been analyzed for unsafe behaviors`,
        severity: 'high',
        actionable: true,
        suggestedAction: 'Analyze each control action for all four UCA types',
        confidence: 1.0
      });
    }

    return insights;
  }

  private analyzeCompleteness(context: AssistantContext): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];
    const report = completenessChecker.checkCompleteness(context);

    if (report.overallScore < 60) {
      insights.push({
        id: 'low-completeness',
        type: 'warning',
        category: InsightCategory.INCOMPLETE_ANALYSIS,
        title: 'Low analysis completeness',
        description: `Overall completeness is only ${report.overallScore.toFixed(1)}%`,
        severity: 'critical',
        actionable: true,
        suggestedAction: 'Focus on completing the steps with lowest scores',
        confidence: 1.0
      });
    }

    // Check-specific insights
    report.checks.forEach((check) => {
      if (check.coverage < 50) {
        insights.push({
          id: `incomplete-${check.id}`,
          type: 'warning',
          category: InsightCategory.INCOMPLETE_ANALYSIS,
          title: `Incomplete ${check.name}`,
          description: `This check is only ${check.coverage.toFixed(1)}% complete`,
          severity: check.coverage < 25 ? 'high' : 'medium',
          actionable: true,
          confidence: 0.9
        });
      }
    });

    return insights;
  }

  private detectPatterns(context: AssistantContext): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    // Pattern: Similar UCAs across multiple controllers
    const ucaDescriptions = new Map<string, UnsafeControlAction[]>();
    context.ucas.forEach(uca => {
      const key = (uca.description || '').toLowerCase();
      if (!ucaDescriptions.has(key)) {
        ucaDescriptions.set(key, []);
      }
      ucaDescriptions.get(key)!.push(uca);
    });

    ucaDescriptions.forEach((ucas, description) => {
      if (ucas.length > 2) {
        insights.push({
          id: `pattern-similar-ucas-${description.substring(0, 20)}`,
          type: 'info',
          category: InsightCategory.PATTERN_DETECTION,
          title: 'Similar UCAs detected',
          description: `${ucas.length} UCAs have similar descriptions. Consider creating a common mitigation strategy.`,
          severity: 'low',
          actionable: true,
          suggestedAction: 'Create a shared requirement to address these similar UCAs',
          confidence: 0.8
        });
      }
    });

    // Pattern: Missing UCA types
    const ucaTypeCount = new Map<string, Map<UCAType, number>>();
    context.controlActions.forEach(ca => {
      const key = ca.id;
      const typeMap = new Map<UCAType, number>();
      
      context.ucas
        .filter(uca => uca.controlActionId === ca.id)
        .forEach(uca => {
          typeMap.set(uca.ucaType, (typeMap.get(uca.ucaType) || 0) + 1);
        });
      
      ucaTypeCount.set(key, typeMap);
    });

    ucaTypeCount.forEach((typeMap, actionId) => {
      const missingTypes: UCAType[] = [];
      const allTypes: UCAType[] = [
        UCAType.NotProvided,
        UCAType.ProvidedUnsafe,
        UCAType.TooEarly,
        UCAType.TooLate,
        UCAType.WrongOrder,
        UCAType.TooLong,
        UCAType.TooShort
      ];
      
      allTypes.forEach(type => {
        if (!typeMap.has(type)) {
          missingTypes.push(type);
        }
      });

      if (missingTypes.length > 0) {
        const action = context.controlActions.find(ca => ca.id === actionId);
        insights.push({
          id: `missing-uca-types-${actionId}`,
          type: 'suggestion',
          category: InsightCategory.PATTERN_DETECTION,
          title: 'Missing UCA type analysis',
          description: `Control action "${action?.verb} ${action?.object}" is missing analysis for: ${missingTypes.join(', ')}`,
          entityType: 'controlAction',
          entityId: actionId,
          severity: 'medium',
          actionable: true,
          suggestedAction: 'Analyze this control action for all four UCA types',
          confidence: 0.95
        });
      }
    });

    return insights;
  }

  private analyzeRisks(context: AssistantContext): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    // High-risk UCAs without scenarios
    const highRiskUCAs = context.ucas.filter(uca => 
      (uca.riskCategory === 'Critical' || uca.riskCategory === 'High') &&
      !context.scenarios.some(s => s.ucaIds?.includes(uca.id))
    );

    if (highRiskUCAs.length > 0) {
      insights.push({
        id: 'high-risk-no-scenarios',
        type: 'error',
        category: InsightCategory.RISK_ASSESSMENT,
        title: 'High-risk UCAs without scenarios',
        description: `${highRiskUCAs.length} critical/high risk UCAs have no causal scenarios defined`,
        severity: 'critical',
        actionable: true,
        suggestedAction: 'Create causal scenarios for all high-risk UCAs immediately',
        confidence: 1.0
      });
    }

    // Unscored UCAs
    const unscoredUCAs = context.ucas.filter(uca => !uca.riskScore);
    if (unscoredUCAs.length > 0) {
      insights.push({
        id: 'unscored-ucas',
        type: 'warning',
        category: InsightCategory.RISK_ASSESSMENT,
        title: 'UCAs without risk scores',
        description: `${unscoredUCAs.length} UCAs have not been risk assessed`,
        severity: 'high',
        actionable: true,
        suggestedAction: 'Perform risk scoring for all UCAs',
        confidence: 1.0
      });
    }

    return insights;
  }

  private checkBestPractices(context: AssistantContext): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    // Check loss descriptions
    const vaguelosses = context.losses.filter(loss => 
      loss.description.length < 50 || 
      !loss.description.match(/\b(injury|damage|loss|failure|accident)\b/i)
    );

    if (vaguelosses.length > 0) {
      insights.push({
        id: 'vague-losses',
        type: 'suggestion',
        category: InsightCategory.BEST_PRACTICES,
        title: 'Improve loss descriptions',
        description: `${vaguelosses.length} loss(es) have vague or incomplete descriptions`,
        severity: 'medium',
        actionable: true,
        suggestedAction: 'Provide detailed descriptions including severity and impact',
        confidence: 0.8
      });
    }

    // Check hazard format
    const poorlyFormattedHazards = context.hazards.filter(hazard =>
      hazard.systemCondition &&
      !hazard.systemCondition.includes('when') &&
      !hazard.systemCondition.includes('while') &&
      !hazard.systemCondition.includes('during')
    );

    if (poorlyFormattedHazards.length > 0) {
      insights.push({
        id: 'hazard-format',
        type: 'suggestion',
        category: InsightCategory.BEST_PRACTICES,
        title: 'Improve hazard formatting',
        description: `${poorlyFormattedHazards.length} hazard(s) don't follow the recommended format`,
        severity: 'low',
        actionable: true,
        suggestedAction: 'Use format: "[System state] when/while [condition] leads to [loss]"',
        confidence: 0.7
      });
    }

    // Check requirement specificity
    const vagueRequirements = context.requirements.filter(req =>
      (req.description || '').length < 30 ||
      !req.verificationMethod ||
      req.verificationMethod === 'TBD'
    );

    if (vagueRequirements.length > 0) {
      insights.push({
        id: 'vague-requirements',
        type: 'warning',
        category: InsightCategory.BEST_PRACTICES,
        title: 'Requirements need more detail',
        description: `${vagueRequirements.length} requirement(s) lack specific details or verification methods`,
        severity: 'medium',
        actionable: true,
        suggestedAction: 'Add specific, measurable criteria and verification methods',
        confidence: 0.9
      });
    }

    return insights;
  }

  private analyzeCoverage(context: AssistantContext): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];

    // Controller coverage
    const controllerCoverage = new Map<string, number>();
    context.controllers.forEach(controller => {
      const ucaCount = context.ucas.filter(uca => uca.controllerId === controller.id).length;
      controllerCoverage.set(controller.id, ucaCount);
    });

    const underanalyzedControllers = Array.from(controllerCoverage.entries())
      .filter(([_, count]) => count < 3)
      .map(([id, _]) => context.controllers.find(c => c.id === id)!);

    if (underanalyzedControllers.length > 0) {
      insights.push({
        id: 'low-controller-coverage',
        type: 'suggestion',
        category: InsightCategory.COVERAGE,
        title: 'Low UCA coverage for some controllers',
        description: `${underanalyzedControllers.length} controller(s) have fewer than 3 UCAs`,
        severity: 'medium',
        actionable: true,
        suggestedAction: 'Review these controllers for additional unsafe behaviors',
        confidence: 0.85,
        reasoning: ['Complex controllers typically have multiple unsafe behaviors']
      });
    }

    // Scenario coverage
    const scenarioCoverage = new Set(
      context.scenarios.flatMap(s => s.ucaIds || [])
    ).size / Math.max(1, context.ucas.length);

    if (scenarioCoverage < 0.7) {
      insights.push({
        id: 'low-scenario-coverage',
        type: 'warning',
        category: InsightCategory.COVERAGE,
        title: 'Insufficient scenario coverage',
        description: `Only ${(scenarioCoverage * 100).toFixed(1)}% of UCAs have causal scenarios`,
        severity: 'high',
        actionable: true,
        suggestedAction: 'Create scenarios for remaining UCAs',
        confidence: 1.0
      });
    }

    return insights;
  }

  /**
   * Suggestion generators
   */
  private generateHazardSuggestions(context: AssistantContext): string[] {
    const suggestions: string[] = [];
    
    // Common hazard patterns
    const patterns = [
      'System provides incorrect information when',
      'System fails to provide required action when',
      'System action occurs too late when',
      'System continues operation when it should stop',
      'Conflicting commands are sent when'
    ];

    // Filter out patterns already used
    const existingPatterns = context.hazards.map(h => (h.systemCondition || '').toLowerCase());
    patterns.forEach(pattern => {
      if (!existingPatterns.some(ep => ep.includes(pattern.toLowerCase()))) {
        suggestions.push(pattern);
      }
    });

    return suggestions;
  }

  private generateUCASuggestions(
    context: AssistantContext,
    currentUCA?: Partial<UnsafeControlAction>
  ): string[] {
    if (!currentUCA?.controlActionId) return [];

    const controlAction = context.controlActions.find(ca => ca.id === currentUCA.controlActionId);
    if (!controlAction) return [];

    const controller = context.controllers.find(c => c.id === controlAction.controllerId);
    const suggestions = smartContextBuilder.generateUCASuggestions(
      currentUCA as UnsafeControlAction,
      controller!,
      controlAction,
      context.hazards,
      context.ucas
    );

    return suggestions.map(s => s.text);
  }

  private generateUCCASuggestions(
    _context: AssistantContext,
    currentUCCA?: Partial<UCCA>
  ): string[] {
    const suggestions: string[] = [];

    if (currentUCCA?.uccaType) {
      switch (currentUCCA.uccaType) {
        case UCCAType.Team:
          suggestions.push(
            'Team members have conflicting mental models',
            'Communication breakdown between team members',
            'Unclear roles and responsibilities',
            'Team coordination failure'
          );
          break;
        case UCCAType.Role:
          suggestions.push(
            'Role boundaries are unclear or overlapping',
            'Authority misalignment with responsibility',
            'Role handoff procedures are inadequate',
            'Training insufficient for role requirements'
          );
          break;
        case UCCAType.CrossController:
          suggestions.push(
            'Controllers have inconsistent process models',
            'Control actions conflict between controllers',
            'Feedback loops create unintended interactions',
            'Timing dependencies between controllers'
          );
          break;
        case UCCAType.Organizational:
          suggestions.push(
            'Organizational culture discourages safety reporting',
            'Resource constraints limit safety measures',
            'Conflicting organizational priorities',
            'Inadequate safety management structure'
          );
          break;
        case UCCAType.Temporal:
          suggestions.push(
            'Time delays exceed safe operational windows',
            'Synchronization failures between components',
            'Race conditions in control sequences',
            'Temporal dependencies not properly managed'
          );
          break;
      }
    }

    return suggestions;
  }

  private generateScenarioSuggestions(
    context: AssistantContext,
    currentScenario?: Partial<CausalScenario>
  ): string[] {
    const suggestions: string[] = [];

    if (currentScenario?.ucaIds && currentScenario.ucaIds.length > 0) {
      const uca = context.ucas.find(u => u.id === currentScenario.ucaIds![0]);
      if (uca) {
        suggestions.push(
          `Normal operation transitions to ${uca.context}`,
          `System enters degraded mode leading to ${uca.description}`,
          `Multiple simultaneous failures result in ${uca.description}`,
          `Operator error combined with system fault causes ${uca.description}`
        );
      }
    }

    return suggestions;
  }

  private generateRequirementSuggestions(
    context: AssistantContext,
    currentRequirement?: Partial<Requirement>
  ): string[] {
    const suggestions: string[] = [];

    if (currentRequirement?.scenarioIds && currentRequirement.scenarioIds.length > 0) {
      const scenario = context.scenarios.find(s => s.id === currentRequirement.scenarioIds![0]);
      if (scenario) {
        suggestions.push(
          `The system shall monitor and prevent ${scenario.title}`,
          `The system shall detect conditions leading to ${scenario.title} within X seconds`,
          `The system shall provide alerts when approaching conditions for ${scenario.title}`,
          `The system shall implement fail-safe behavior to prevent ${scenario.title}`
        );
      }
    }

    return suggestions;
  }

  /**
   * Validation methods
   */
  private validateLoss(loss: Loss): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!loss.title || loss.title.length < 5) {
      issues.push('Loss title is too short');
      suggestions.push('Provide a clear, concise title');
    }

    if (!loss.description || loss.description.length < 20) {
      issues.push('Loss description is insufficient');
      suggestions.push('Describe the loss in detail, including impact and severity');
    }

    if (!loss.code) {
      issues.push('Loss code is missing');
      suggestions.push('Add a unique identifier (e.g., L-1, L-2)');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private validateHazard(hazard: Hazard, _context: AssistantContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!hazard.systemCondition || hazard.systemCondition.length < 10) {
      issues.push('System condition is too vague');
      suggestions.push('Describe the specific system state or condition');
    }

    if (!hazard.lossIds || hazard.lossIds.length === 0) {
      issues.push('Hazard is not linked to any losses');
      suggestions.push('Link to at least one loss');
    }

    if (!hazard.code) {
      issues.push('Hazard code is missing');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private validateUCA(uca: UnsafeControlAction, _context: AssistantContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!uca.context || uca.context.length < 10) {
      issues.push('UCA context is too vague');
      suggestions.push('Specify the conditions under which this becomes unsafe');
    }

    if (uca.hazardIds.length === 0) {
      issues.push('UCA is not linked to any hazards');
      suggestions.push('Link to relevant hazards');
    }

    if (!uca.description || uca.description.length < 20) {
      issues.push('UCA description needs more detail');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private validateUCCA(ucca: UCCA, _context: AssistantContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!ucca.description || ucca.description.length < 15) {
      issues.push('UCCA description is insufficient');
      suggestions.push('Describe the causal factor in detail');
    }

    if (ucca.involvedControllerIds.length === 0) {
      issues.push('No controllers are associated with this UCCA');
    }

    if (ucca.hazardIds.length === 0) {
      issues.push('UCCA is not linked to any hazards');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private validateScenario(scenario: CausalScenario, _context: AssistantContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!scenario.description || scenario.description.length < 30) {
      issues.push('Scenario description needs more detail');
      suggestions.push('Describe the complete chain of events');
    }

    if ((!scenario.ucaIds || scenario.ucaIds.length === 0) && 
        (!scenario.uccaIds || scenario.uccaIds.length === 0)) {
      issues.push('Scenario is not linked to any UCAs or UCCAs');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private validateRequirement(requirement: Requirement, _context: AssistantContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!requirement.description || requirement.description.length < 20) {
      issues.push('Requirement description is too brief');
      suggestions.push('Use specific, measurable language');
    }

    if (!requirement.verificationMethod || requirement.verificationMethod === 'TBD') {
      issues.push('Verification method is not specified');
      suggestions.push('Define how this requirement will be verified');
    }

    if (!requirement.scenarioIds || requirement.scenarioIds.length === 0) {
      issues.push('Requirement is not linked to any scenarios');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Auto-completion methods
   */
  private autoCompleteUCA(
    partialUCA: Partial<UnsafeControlAction>,
    context: AssistantContext
  ): Partial<UnsafeControlAction> {
    const completed = { ...partialUCA };

    // Auto-generate code if missing
    if (!completed.code && completed.controllerId && completed.controlActionId) {
      const controller = context.controllers.find(c => c.id === completed.controllerId);
      // Control action lookup removed - was unused
      const ucaCount = context.ucas.filter(u => 
        u.controllerId === completed.controllerId &&
        u.controlActionId === completed.controlActionId
      ).length;
      
      completed.code = `UCA-${controller?.name.substring(0, 3).toUpperCase()}-${ucaCount + 1}`;
    }

    // Suggest risk scoring
    if (!completed.riskScore && completed.hazardIds && completed.hazardIds.length > 0) {
      const hazards = context.hazards.filter(h => completed.hazardIds!.includes(h.id));
      const suggestedScore = riskScoringEngine.calculateUCARisk(
        {
          ...completed,
          riskScore: 0,
          riskCategory: 'Medium'
        } as UnsafeControlAction,
        hazards,
        context.controllers.find(c => c.id === completed.controllerId)!,
        context.controlActions.find(ca => ca.id === completed.controlActionId)!
      );
      
      completed.riskScore = suggestedScore.overall;
      completed.riskCategory = suggestedScore.category as any;
    }

    return completed;
  }

  private autoCompleteUCCA(
    partialUCCA: Partial<UCCA>,
    context: AssistantContext
  ): Partial<UCCA> {
    const completed = { ...partialUCCA };

    // Auto-generate code
    if (!completed.code && completed.uccaType) {
      const typeCount = context.uccas.filter(u => u.uccaType === completed.uccaType).length;
      completed.code = `UCCA-${completed.uccaType}-${typeCount + 1}`;
    }

    // Suggest hazard links based on involved controllers
    if (completed.involvedControllerIds && completed.involvedControllerIds.length > 0 &&
        (!completed.hazardIds || completed.hazardIds.length === 0)) {
      const relevantUCAs = context.ucas.filter(uca =>
        completed.involvedControllerIds!.includes(uca.controllerId)
      );
      const hazardIds = new Set<string>();
      relevantUCAs.forEach(uca => {
        uca.hazardIds.forEach(id => hazardIds.add(id));
      });
      completed.hazardIds = Array.from(hazardIds);
    }

    return completed;
  }

  private autoCompleteScenario(
    partialScenario: Partial<CausalScenario>,
    context: AssistantContext
  ): Partial<CausalScenario> {
    const completed = { ...partialScenario };

    // Auto-generate title if missing
    if (!completed.title && completed.ucaIds && completed.ucaIds.length > 0) {
      const uca = context.ucas.find(u => u.id === completed.ucaIds![0]);
      if (uca) {
        completed.title = `Scenario leading to: ${(uca.description || '').substring(0, 50)}...`;
      }
    }

    // Auto-generate code
    if (!completed.code) {
      const scenarioCount = context.scenarios.length;
      completed.code = `CS-${scenarioCount + 1}`;
    }

    return completed;
  }

  /**
   * Initialize patterns and capabilities
   */
  private initializePatterns(): void {
    // Add common analysis patterns
    const patterns: AnalysisPattern[] = [
      {
        id: 'incomplete-uca-types',
        name: 'Incomplete UCA Type Coverage',
        description: 'Detects control actions missing analysis for certain UCA types',
        matches: (context) => {
          return context.controlActions.some(ca => {
            const ucaTypes = new Set(
              context.ucas
                .filter(uca => uca.controlActionId === ca.id)
                .map(uca => uca.ucaType)
            );
            return ucaTypes.size < 4;
          });
        },
        generateInsights: (_context) => {
          const insights: AnalysisInsight[] = [];
          // Implementation provided in detectPatterns method
          return insights;
        }
      }
    ];

    patterns.forEach(p => this.patterns.set(p.id, p));
  }

  private initializeCapabilities(): void {
    const capabilities: AssistantCapability[] = [
      {
        id: 'pattern-detection',
        name: 'Pattern Detection',
        description: 'Identifies common patterns and anti-patterns in analysis',
        enabled: true,
        confidence: 0.85
      },
      {
        id: 'auto-suggestion',
        name: 'Auto Suggestion',
        description: 'Provides context-aware suggestions',
        enabled: true,
        confidence: 0.75
      },
      {
        id: 'validation',
        name: 'Real-time Validation',
        description: 'Validates entities as they are created',
        enabled: true,
        confidence: 0.95
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        description: 'Analyzes and suggests risk scores',
        enabled: true,
        confidence: 0.8
      }
    ];

    capabilities.forEach(c => this.capabilities.set(c.id, c));
  }

  /**
   * Get current capabilities
   */
  getCapabilities(): AssistantCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Enable/disable capability
   */
  setCapability(id: string, enabled: boolean): void {
    const capability = this.capabilities.get(id);
    if (capability) {
      capability.enabled = enabled;
    }
  }
}

// Export singleton instance
export const aiAssistant = new AIAssistant();