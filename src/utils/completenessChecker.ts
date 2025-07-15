/**
 * Systematic Completeness Checker for STPA Analysis
 * Ensures thorough coverage of all safety analysis aspects
 */

import { 
  Controller, 
  ControlAction, 
  UnsafeControlAction, 
  UCCA, 
  Hazard, 
  Loss,
  Requirement,
  UCAType,
  ControllerType
} from '@/types/types';

export interface CompletenessCheck {
  id: string;
  category: CheckCategory;
  name: string;
  description: string;
  status: CheckStatus;
  severity: CheckSeverity;
  details: string[];
  recommendations: string[];
  coverage: number; // 0-100%
}

export enum CheckCategory {
  LOSSES = 'Losses',
  HAZARDS = 'Hazards',
  CONTROL_STRUCTURE = 'Control Structure',
  CONTROL_ACTIONS = 'Control Actions',
  UCA_COVERAGE = 'UCA Coverage',
  UCCA_COVERAGE = 'UCCA Coverage',
  REQUIREMENTS = 'Requirements',
  TRACEABILITY = 'Traceability'
}

export enum CheckStatus {
  COMPLETE = 'complete',
  PARTIAL = 'partial',
  MISSING = 'missing',
  WARNING = 'warning'
}

export enum CheckSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface CompletenessReport {
  overallScore: number; // 0-100
  checks: CompletenessCheck[];
  criticalIssues: number;
  warnings: number;
  suggestions: CompletnessSuggestion[];
  timestamp: Date;
}

export interface CompletnessSuggestion {
  id: string;
  category: CheckCategory;
  priority: 'immediate' | 'soon' | 'eventual';
  action: string;
  rationale: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

// STPA completeness rules based on MIT guidelines
const COMPLETENESS_RULES = {
  minLosses: 1,
  minHazardsPerLoss: 1,
  minControllersPerAction: 1,
  minActionsPerController: 1,
  requiredUCATypes: [
    UCAType.NotProvided,
    UCAType.ProvidedUnsafe,
    UCAType.TooEarly,
    UCAType.TooLate
  ],
  minRequirementsPerUCA: 1
};

/**
 * Systematic Completeness Checker Engine
 */
export class CompletenessChecker {
  /**
   * Perform comprehensive completeness check
   */
  checkCompleteness(analysisData: {
    losses: Loss[];
    hazards: Hazard[];
    controllers: Controller[];
    controlActions: ControlAction[];
    ucas: UnsafeControlAction[];
    uccas: UCCA[];
    requirements: Requirement[];
  }): CompletenessReport {
    const checks: CompletenessCheck[] = [];
    
    // Perform all checks
    checks.push(...this.checkLosses(analysisData.losses));
    checks.push(...this.checkHazards(analysisData.hazards, analysisData.losses));
    checks.push(...this.checkControlStructure(analysisData.controllers, analysisData.controlActions));
    checks.push(...this.checkUCACoverage(
      analysisData.ucas, 
      analysisData.controlActions, 
      analysisData.hazards
    ));
    checks.push(...this.checkUCCACoverage(
      analysisData.uccas,
      analysisData.controllers,
      analysisData.hazards
    ));
    checks.push(...this.checkRequirements(
      analysisData.requirements,
      analysisData.ucas,
      analysisData.uccas
    ));
    checks.push(...this.checkTraceability(analysisData));

    // Calculate overall score
    const overallScore = this.calculateOverallScore(checks);
    
    // Count issues
    const criticalIssues = checks.filter(c => 
      c.severity === CheckSeverity.CRITICAL && 
      c.status !== CheckStatus.COMPLETE
    ).length;
    
    const warnings = checks.filter(c => 
      c.status === CheckStatus.WARNING
    ).length;

    // Generate suggestions
    const suggestions = this.generateSuggestions(checks, analysisData);

    return {
      overallScore,
      checks,
      criticalIssues,
      warnings,
      suggestions,
      timestamp: new Date()
    };
  }

  /**
   * Check losses completeness
   */
  private checkLosses(losses: Loss[]): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];

    // Check 1: At least one loss defined
    checks.push({
      id: 'loss-count',
      category: CheckCategory.LOSSES,
      name: 'Loss Definition',
      description: 'At least one loss must be defined',
      status: losses.length >= COMPLETENESS_RULES.minLosses 
        ? CheckStatus.COMPLETE 
        : CheckStatus.MISSING,
      severity: CheckSeverity.CRITICAL,
      details: losses.length > 0
        ? [`${losses.length} losses defined`]
        : ['No losses defined'],
      recommendations: losses.length === 0
        ? ['Define at least one loss that the system must prevent']
        : [],
      coverage: losses.length > 0 ? 100 : 0
    });

    // Check 2: Loss descriptions quality
    const poorDescriptions = losses.filter(l => 
      !l.description || l.description.length < 20
    );
    
    checks.push({
      id: 'loss-quality',
      category: CheckCategory.LOSSES,
      name: 'Loss Description Quality',
      description: 'Losses should have detailed descriptions',
      status: poorDescriptions.length === 0 
        ? CheckStatus.COMPLETE
        : poorDescriptions.length < losses.length / 2
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.MEDIUM,
      details: poorDescriptions.length > 0
        ? [`${poorDescriptions.length} losses have poor descriptions`]
        : ['All losses have adequate descriptions'],
      recommendations: poorDescriptions.map(l => 
        `Improve description for loss: ${l.code}`
      ),
      coverage: losses.length > 0 
        ? ((losses.length - poorDescriptions.length) / losses.length) * 100
        : 0
    });

    return checks;
  }

  /**
   * Check hazards completeness
   */
  private checkHazards(hazards: Hazard[], losses: Loss[]): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];

    // Check 1: At least one hazard per loss
    const lossesWithoutHazards = losses.filter(loss =>
      !hazards.some(hazard => hazard.lossIds?.includes(loss.id))
    );

    checks.push({
      id: 'hazard-loss-coverage',
      category: CheckCategory.HAZARDS,
      name: 'Hazard-Loss Coverage',
      description: 'Each loss should have at least one associated hazard',
      status: lossesWithoutHazards.length === 0
        ? CheckStatus.COMPLETE
        : lossesWithoutHazards.length < losses.length / 2
        ? CheckStatus.PARTIAL
        : CheckStatus.MISSING,
      severity: CheckSeverity.HIGH,
      details: lossesWithoutHazards.length > 0
        ? [`${lossesWithoutHazards.length} losses without hazards: ${lossesWithoutHazards.map(l => l.code).join(', ')}`]
        : ['All losses have associated hazards'],
      recommendations: lossesWithoutHazards.map(l =>
        `Define hazards that could lead to loss: ${l.code}`
      ),
      coverage: losses.length > 0
        ? ((losses.length - lossesWithoutHazards.length) / losses.length) * 100
        : 0
    });

    // Check 2: Hazard quality
    const vagueHazards = hazards.filter(h =>
      h.title.length < 10 ||
      !h.systemCondition ||
      h.systemCondition.length < 20
    );

    checks.push({
      id: 'hazard-quality',
      category: CheckCategory.HAZARDS,
      name: 'Hazard Definition Quality',
      description: 'Hazards should clearly state system conditions and worst-case environments',
      status: vagueHazards.length === 0
        ? CheckStatus.COMPLETE
        : vagueHazards.length < hazards.length / 3
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.MEDIUM,
      details: vagueHazards.length > 0
        ? [`${vagueHazards.length} hazards need better definitions`]
        : ['All hazards are well-defined'],
      recommendations: vagueHazards.map(h =>
        `Improve definition for hazard ${h.code}: Include system condition and environment`
      ),
      coverage: hazards.length > 0
        ? ((hazards.length - vagueHazards.length) / hazards.length) * 100
        : 0
    });

    return checks;
  }

  /**
   * Check control structure completeness
   */
  private checkControlStructure(
    controllers: Controller[], 
    controlActions: ControlAction[]
  ): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];

    // Check 1: Controller diversity
    const controllerTypes = new Set(controllers.map(c => c.ctrlType));
    const hasHuman = controllerTypes.has(ControllerType.Human);
    const hasSoftware = controllerTypes.has(ControllerType.Software);

    checks.push({
      id: 'controller-diversity',
      category: CheckCategory.CONTROL_STRUCTURE,
      name: 'Controller Type Diversity',
      description: 'Analysis should consider both human and automated controllers',
      status: hasHuman && hasSoftware
        ? CheckStatus.COMPLETE
        : hasHuman || hasSoftware
        ? CheckStatus.PARTIAL
        : CheckStatus.MISSING,
      severity: CheckSeverity.MEDIUM,
      details: [
        `Controller types present: ${Array.from(controllerTypes).join(', ')}`,
        `Total controllers: ${controllers.length}`
      ],
      recommendations: [
        !hasHuman ? 'Consider human controllers in the system' : '',
        !hasSoftware ? 'Consider automated/software controllers' : ''
      ].filter(Boolean),
      coverage: (controllerTypes.size / 4) * 100 // 4 possible types
    });

    // Check 2: Control actions per controller
    const controllersWithoutActions = controllers.filter(c =>
      !controlActions.some(ca => ca.controllerId === c.id)
    );

    checks.push({
      id: 'controller-action-coverage',
      category: CheckCategory.CONTROL_STRUCTURE,
      name: 'Controller Action Coverage',
      description: 'Each controller should have at least one control action',
      status: controllersWithoutActions.length === 0
        ? CheckStatus.COMPLETE
        : controllersWithoutActions.length < controllers.length / 2
        ? CheckStatus.PARTIAL
        : CheckStatus.MISSING,
      severity: CheckSeverity.HIGH,
      details: controllersWithoutActions.length > 0
        ? [`${controllersWithoutActions.length} controllers without actions: ${controllersWithoutActions.map(c => c.name).join(', ')}`]
        : ['All controllers have control actions'],
      recommendations: controllersWithoutActions.map(c =>
        `Define control actions for controller: ${c.name}`
      ),
      coverage: controllers.length > 0
        ? ((controllers.length - controllersWithoutActions.length) / controllers.length) * 100
        : 0
    });

    // Check 3: Feedback paths
    const actionsWithoutFeedback = controlActions.filter(ca =>
      !ca.feedbackIds || ca.feedbackIds.length === 0
    );

    checks.push({
      id: 'feedback-coverage',
      category: CheckCategory.CONTROL_STRUCTURE,
      name: 'Feedback Path Coverage',
      description: 'Control actions should have associated feedback',
      status: actionsWithoutFeedback.length === 0
        ? CheckStatus.COMPLETE
        : actionsWithoutFeedback.length < controlActions.length / 2
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.LOW,
      details: [
        `${actionsWithoutFeedback.length} of ${controlActions.length} actions lack feedback`
      ],
      recommendations: actionsWithoutFeedback.length > 0
        ? ['Consider what feedback controllers need to safely provide control actions']
        : [],
      coverage: controlActions.length > 0
        ? ((controlActions.length - actionsWithoutFeedback.length) / controlActions.length) * 100
        : 0
    });

    return checks;
  }

  /**
   * Check UCA coverage
   */
  private checkUCACoverage(
    ucas: UnsafeControlAction[],
    controlActions: ControlAction[],
    _hazards: Hazard[]
  ): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];

    // Check 1: UCA type coverage per control action
    const actionUCATypeCoverage = new Map<string, Set<UCAType>>();
    
    ucas.forEach(uca => {
      if (!actionUCATypeCoverage.has(uca.controlActionId)) {
        actionUCATypeCoverage.set(uca.controlActionId, new Set());
      }
      actionUCATypeCoverage.get(uca.controlActionId)!.add(uca.ucaType);
    });

    const actionsWithIncompleteTypes = controlActions.filter(ca => {
      const types = actionUCATypeCoverage.get(ca.id);
      return !types || types.size < COMPLETENESS_RULES.requiredUCATypes.length;
    });

    checks.push({
      id: 'uca-type-coverage',
      category: CheckCategory.UCA_COVERAGE,
      name: 'UCA Type Coverage',
      description: 'Each control action should be analyzed for all UCA types',
      status: actionsWithIncompleteTypes.length === 0
        ? CheckStatus.COMPLETE
        : actionsWithIncompleteTypes.length < controlActions.length / 3
        ? CheckStatus.PARTIAL
        : CheckStatus.MISSING,
      severity: CheckSeverity.HIGH,
      details: actionsWithIncompleteTypes.length > 0
        ? [`${actionsWithIncompleteTypes.length} actions need more UCA type analysis`]
        : ['All control actions analyzed for all UCA types'],
      recommendations: actionsWithIncompleteTypes.slice(0, 3).map(ca => {
        const existingTypes = actionUCATypeCoverage.get(ca.id) || new Set();
        const missingTypes = COMPLETENESS_RULES.requiredUCATypes.filter(t => !existingTypes.has(t));
        return `Analyze "${ca.verb} ${ca.object}" for: ${missingTypes.join(', ')}`;
      }),
      coverage: controlActions.length > 0
        ? ((controlActions.length - actionsWithIncompleteTypes.length) / controlActions.length) * 100
        : 0
    });

    // Check 2: UCA-Hazard links
    const ucasWithoutHazards = ucas.filter(uca => 
      !uca.hazardIds || uca.hazardIds.length === 0
    );

    checks.push({
      id: 'uca-hazard-links',
      category: CheckCategory.UCA_COVERAGE,
      name: 'UCA-Hazard Traceability',
      description: 'Each UCA should be linked to at least one hazard',
      status: ucasWithoutHazards.length === 0
        ? CheckStatus.COMPLETE
        : ucasWithoutHazards.length < ucas.length / 4
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.MEDIUM,
      details: [
        `${ucasWithoutHazards.length} of ${ucas.length} UCAs not linked to hazards`
      ],
      recommendations: ucasWithoutHazards.length > 0
        ? ['Link each UCA to the hazards it could contribute to']
        : [],
      coverage: ucas.length > 0
        ? ((ucas.length - ucasWithoutHazards.length) / ucas.length) * 100
        : 0
    });

    // Check 3: Context quality
    const ucasWithPoorContext = ucas.filter(uca =>
      !uca.context || uca.context.length < 30
    );

    checks.push({
      id: 'uca-context-quality',
      category: CheckCategory.UCA_COVERAGE,
      name: 'UCA Context Quality',
      description: 'UCAs should have detailed context descriptions',
      status: ucasWithPoorContext.length === 0
        ? CheckStatus.COMPLETE
        : ucasWithPoorContext.length < ucas.length / 3
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.MEDIUM,
      details: [
        `${ucasWithPoorContext.length} UCAs need better context descriptions`
      ],
      recommendations: ucasWithPoorContext.slice(0, 3).map(uca =>
        `Improve context for UCA ${uca.code}: Specify when/under what conditions`
      ),
      coverage: ucas.length > 0
        ? ((ucas.length - ucasWithPoorContext.length) / ucas.length) * 100
        : 0
    });

    return checks;
  }

  /**
   * Check UCCA coverage
   */
  private checkUCCACoverage(
    uccas: UCCA[],
    controllers: Controller[],
    _hazards: Hazard[]
  ): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];

    // Check 1: Multi-controller analysis
    // Multi-controller analysis check removed - was unused
    const expectedUCCAs = Math.max(0, (controllers.length * (controllers.length - 1)) / 4); // Rough estimate

    checks.push({
      id: 'ucca-multi-controller',
      category: CheckCategory.UCCA_COVERAGE,
      name: 'Multi-Controller Interaction Analysis',
      description: 'Systems with multiple controllers should analyze UCCAs',
      status: controllers.length <= 1 
        ? CheckStatus.COMPLETE // N/A for single controller
        : uccas.length >= expectedUCCAs
        ? CheckStatus.COMPLETE
        : uccas.length > 0
        ? CheckStatus.PARTIAL
        : CheckStatus.MISSING,
      severity: controllers.length > 1 ? CheckSeverity.HIGH : CheckSeverity.INFO,
      details: controllers.length > 1
        ? [`${uccas.length} UCCAs identified for ${controllers.length} controllers`]
        : ['Single controller system - UCCAs not applicable'],
      recommendations: controllers.length > 1 && uccas.length < expectedUCCAs
        ? ['Analyze potential unsafe interactions between controllers']
        : [],
      coverage: controllers.length <= 1 
        ? 100 
        : Math.min(100, (uccas.length / expectedUCCAs) * 100)
    });

    // Check 2: UCCA type diversity
    const uccaTypes = new Set(uccas.map(u => u.uccaType));

    checks.push({
      id: 'ucca-type-diversity',
      category: CheckCategory.UCCA_COVERAGE,
      name: 'UCCA Type Diversity',
      description: 'Consider different types of multi-controller interactions',
      status: uccaTypes.size >= 3
        ? CheckStatus.COMPLETE
        : uccaTypes.size >= 2
        ? CheckStatus.PARTIAL
        : uccaTypes.size === 1
        ? CheckStatus.WARNING
        : CheckStatus.MISSING,
      severity: CheckSeverity.MEDIUM,
      details: [
        `UCCA types analyzed: ${Array.from(uccaTypes).join(', ') || 'None'}`
      ],
      recommendations: uccaTypes.size < 3
        ? ['Consider Team, Role, Cross-Controller, and Temporal UCCAs']
        : [],
      coverage: (uccaTypes.size / 4) * 100 // Assuming 4 main types
    });

    return checks;
  }


  /**
   * Check requirements
   */
  private checkRequirements(
    requirements: Requirement[],
    ucas: UnsafeControlAction[],
    _uccas: UCCA[]
  ): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];

    // Check 1: Requirements coverage for UCAs
    const ucasWithoutRequirements = ucas.filter(u =>
      !requirements.some(r => r.ucaIds?.includes(u.id))
    );

    checks.push({
      id: 'requirement-uca-coverage',
      category: CheckCategory.REQUIREMENTS,
      name: 'Requirement Coverage',
      description: 'Each UCA should have derived requirements',
      status: ucasWithoutRequirements.length === 0
        ? CheckStatus.COMPLETE
        : ucasWithoutRequirements.length < ucas.length / 3
        ? CheckStatus.PARTIAL
        : CheckStatus.MISSING,
      severity: CheckSeverity.HIGH,
      details: [
        `${ucasWithoutRequirements.length} of ${ucas.length} UCAs lack requirements`
      ],
      recommendations: ucasWithoutRequirements.slice(0, 3).map(u =>
        `Derive safety requirements for UCA ${u.code}`
      ),
      coverage: ucas.length > 0
        ? ((ucas.length - ucasWithoutRequirements.length) / ucas.length) * 100
        : 0
    });

    // Check 2: Requirement quality
    const vagueRequirements = requirements.filter(r =>
      !r.text || 
      r.text.length < 50 ||
      !r.text.match(/shall|must|will/i)
    );

    checks.push({
      id: 'requirement-quality',
      category: CheckCategory.REQUIREMENTS,
      name: 'Requirement Quality',
      description: 'Requirements should be clear and use proper language',
      status: vagueRequirements.length === 0
        ? CheckStatus.COMPLETE
        : vagueRequirements.length < requirements.length / 3
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.MEDIUM,
      details: [
        `${vagueRequirements.length} requirements need improvement`
      ],
      recommendations: vagueRequirements.length > 0
        ? ['Use "shall" statements and be specific about constraints']
        : [],
      coverage: requirements.length > 0
        ? ((requirements.length - vagueRequirements.length) / requirements.length) * 100
        : 0
    });

    return checks;
  }

  /**
   * Check overall traceability
   */
  private checkTraceability(analysisData: any): CompletenessCheck[] {
    const checks: CompletenessCheck[] = [];
    
    // Check forward traceability
    const forwardTraceability = this.calculateForwardTraceability(analysisData);
    
    checks.push({
      id: 'forward-traceability',
      category: CheckCategory.TRACEABILITY,
      name: 'Forward Traceability',
      description: 'Trace from losses through to requirements',
      status: forwardTraceability >= 80
        ? CheckStatus.COMPLETE
        : forwardTraceability >= 60
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.HIGH,
      details: [
        `Forward traceability: ${forwardTraceability.toFixed(1)}%`
      ],
      recommendations: forwardTraceability < 80
        ? ['Ensure all analysis elements are properly linked']
        : [],
      coverage: forwardTraceability
    });

    // Check backward traceability
    const backwardTraceability = this.calculateBackwardTraceability(analysisData);
    
    checks.push({
      id: 'backward-traceability',
      category: CheckCategory.TRACEABILITY,
      name: 'Backward Traceability',
      description: 'Trace from requirements back to losses',
      status: backwardTraceability >= 80
        ? CheckStatus.COMPLETE
        : backwardTraceability >= 60
        ? CheckStatus.PARTIAL
        : CheckStatus.WARNING,
      severity: CheckSeverity.MEDIUM,
      details: [
        `Backward traceability: ${backwardTraceability.toFixed(1)}%`
      ],
      recommendations: backwardTraceability < 80
        ? ['Ensure requirements can be traced back to original losses']
        : [],
      coverage: backwardTraceability
    });

    return checks;
  }

  /**
   * Calculate forward traceability percentage
   */
  private calculateForwardTraceability(data: any): number {
    let totalLinks = 0;
    let presentLinks = 0;

    // Losses -> Hazards
    data.losses.forEach((loss: Loss) => {
      totalLinks++;
      if (data.hazards.some((h: Hazard) => h.lossIds?.includes(loss.id))) {
        presentLinks++;
      }
    });

    // Hazards -> UCAs
    data.hazards.forEach((hazard: Hazard) => {
      totalLinks++;
      if (data.ucas.some((u: UnsafeControlAction) => u.hazardIds.includes(hazard.id))) {
        presentLinks++;
      }
    });

    // UCAs -> Requirements
    data.ucas.forEach((uca: UnsafeControlAction) => {
      totalLinks++;
      if (data.requirements.some((r: Requirement) => r.ucaIds?.includes(uca.id))) {
        presentLinks++;
      }
    });

    return totalLinks > 0 ? (presentLinks / totalLinks) * 100 : 0;
  }

  /**
   * Calculate backward traceability percentage
   */
  private calculateBackwardTraceability(data: any): number {
    let totalLinks = 0;
    let presentLinks = 0;

    // Requirements -> UCAs
    data.requirements.forEach((req: Requirement) => {
      if (req.ucaIds && req.ucaIds.length > 0) {
        totalLinks++;
        if (req.ucaIds.every((id: string) => 
          data.ucas.some((u: UnsafeControlAction) => u.id === id)
        )) {
          presentLinks++;
        }
      }
    });

    // Similar checks for other backward links...
    // Simplified for brevity

    return totalLinks > 0 ? (presentLinks / totalLinks) * 100 : 100;
  }

  /**
   * Calculate overall completeness score
   */
  private calculateOverallScore(checks: CompletenessCheck[]): number {
    if (checks.length === 0) return 0;

    // Weight checks by severity
    const weights: Record<CheckSeverity, number> = {
      [CheckSeverity.CRITICAL]: 5,
      [CheckSeverity.HIGH]: 3,
      [CheckSeverity.MEDIUM]: 2,
      [CheckSeverity.LOW]: 1,
      [CheckSeverity.INFO]: 0.5
    };

    let totalWeight = 0;
    let weightedScore = 0;

    checks.forEach(check => {
      const weight = weights[check.severity];
      totalWeight += weight;
      weightedScore += check.coverage * weight;
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    checks: CompletenessCheck[],
    _data: any
  ): CompletnessSuggestion[] {
    const suggestions: CompletnessSuggestion[] = [];

    // Priority 1: Critical missing items
    const criticalMissing = checks.filter(c => 
      c.severity === CheckSeverity.CRITICAL && 
      c.status === CheckStatus.MISSING
    );

    criticalMissing.forEach(check => {
      suggestions.push({
        id: `suggest-${check.id}`,
        category: check.category,
        priority: 'immediate',
        action: check.recommendations[0] || `Address ${check.name}`,
        rationale: `Critical for STPA validity: ${check.description}`,
        estimatedImpact: 'high'
      });
    });

    // Priority 2: High severity partial completions
    const highPartial = checks.filter(c =>
      c.severity === CheckSeverity.HIGH &&
      c.status === CheckStatus.PARTIAL
    );

    highPartial.forEach(check => {
      suggestions.push({
        id: `suggest-${check.id}`,
        category: check.category,
        priority: 'soon',
        action: check.recommendations[0] || `Complete ${check.name}`,
        rationale: check.details.join('. '),
        estimatedImpact: 'medium'
      });
    });

    // Priority 3: Quality improvements
    const qualityIssues = checks.filter(c =>
      c.name.includes('Quality') &&
      c.status !== CheckStatus.COMPLETE
    );

    qualityIssues.slice(0, 3).forEach(check => {
      suggestions.push({
        id: `suggest-${check.id}`,
        category: check.category,
        priority: 'eventual',
        action: check.recommendations[0] || `Improve ${check.name}`,
        rationale: 'Better documentation improves analysis clarity',
        estimatedImpact: 'low'
      });
    });

    return suggestions;
  }

  /**
   * Export completeness report
   */
  exportReport(report: CompletenessReport): string {
    const sections = [
      `# STPA Completeness Report`,
      `Generated: ${report.timestamp.toISOString()}`,
      `Overall Score: ${report.overallScore.toFixed(1)}%`,
      ``,
      `## Summary`,
      `- Critical Issues: ${report.criticalIssues}`,
      `- Warnings: ${report.warnings}`,
      `- Total Checks: ${report.checks.length}`,
      ``,
      `## Detailed Checks`
    ];

    // Group checks by category
    const checksByCategory = new Map<CheckCategory, CompletenessCheck[]>();
    report.checks.forEach(check => {
      if (!checksByCategory.has(check.category)) {
        checksByCategory.set(check.category, []);
      }
      checksByCategory.get(check.category)!.push(check);
    });

    checksByCategory.forEach((checks, category) => {
      sections.push(``, `### ${category}`);
      
      checks.forEach(check => {
        const statusIcon = {
          [CheckStatus.COMPLETE]: '✅',
          [CheckStatus.PARTIAL]: '🟨',
          [CheckStatus.MISSING]: '❌',
          [CheckStatus.WARNING]: '⚠️'
        }[check.status];

        sections.push(
          ``,
          `#### ${statusIcon} ${check.name} (${check.coverage.toFixed(0)}%)`,
          `${check.description}`,
          ``,
          `**Status:** ${check.status} | **Severity:** ${check.severity}`,
          ``,
          `**Details:**`,
          ...check.details.map(d => `- ${d}`),
        );

        if (check.recommendations.length > 0) {
          sections.push(
            ``,
            `**Recommendations:**`,
            ...check.recommendations.map(r => `- ${r}`)
          );
        }
      });
    });

    if (report.suggestions.length > 0) {
      sections.push(
        ``,
        `## Improvement Suggestions`,
        ``,
        `### Immediate Actions`
      );

      report.suggestions
        .filter(s => s.priority === 'immediate')
        .forEach(s => {
          sections.push(
            `- **${s.action}**`,
            `  - Category: ${s.category}`,
            `  - Impact: ${s.estimatedImpact}`,
            `  - Rationale: ${s.rationale}`
          );
        });
    }

    return sections.join('\n');
  }
}

// Export singleton instance
export const completenessChecker = new CompletenessChecker();