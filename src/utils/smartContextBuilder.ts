/**
 * Smart Context Builder with ML-like suggestions
 * Provides intelligent context suggestions for UCAs and UCCAs based on patterns
 */

import { 
  UnsafeControlAction, 
  UCCA, 
  Controller, 
  ControlAction, 
  Hazard,
  UCAType,
  ControllerType
} from '@/types/types';

export interface ContextSuggestion {
  id: string;
  text: string;
  confidence: number; // 0-1
  category: ContextCategory;
  source: SuggestionSource;
  keywords: string[];
  applicableTypes?: UCAType[];
}

export enum ContextCategory {
  TEMPORAL = 'temporal',
  MODAL = 'modal',
  ENVIRONMENTAL = 'environmental',
  SYSTEM_STATE = 'system_state',
  COORDINATION = 'coordination',
  FAILURE_MODE = 'failure_mode',
  OPERATIONAL = 'operational'
}

export enum SuggestionSource {
  PATTERN = 'pattern',
  SIMILAR_UCA = 'similar_uca',
  HAZARD_BASED = 'hazard_based',
  DOMAIN_KNOWLEDGE = 'domain_knowledge',
  TEMPORAL_LOGIC = 'temporal_logic'
}

// Domain-specific context patterns
const CONTEXT_PATTERNS = [
  // Temporal patterns
  {
    category: ContextCategory.TEMPORAL,
    patterns: [
      'During {phase} phase when {condition}',
      'Before {prerequisite} has been completed',
      'After {duration} of continuous operation',
      'While transitioning from {state1} to {state2}',
      'Within {timeframe} of {trigger_event}'
    ],
    keywords: ['during', 'before', 'after', 'while', 'within', 'when']
  },
  // Modal patterns
  {
    category: ContextCategory.MODAL,
    patterns: [
      'When system is in {mode} mode',
      'While operating in {configuration} configuration',
      'During {automatic/manual} control mode',
      'When {subsystem} is in {state} state'
    ],
    keywords: ['mode', 'configuration', 'state', 'operating', 'automatic', 'manual']
  },
  // Environmental patterns
  {
    category: ContextCategory.ENVIRONMENTAL,
    patterns: [
      'Under {weather} conditions',
      'When visibility is below {threshold}',
      'During {day/night} operations',
      'In {high/low} workload situations',
      'When environmental conditions exceed {limits}'
    ],
    keywords: ['visibility', 'weather', 'conditions', 'workload', 'environmental']
  },
  // System state patterns
  {
    category: ContextCategory.SYSTEM_STATE,
    patterns: [
      'When {component} has failed',
      'While {sensor} data is unavailable',
      'When {parameter} exceeds {threshold}',
      'During degraded {system} performance',
      'When backup systems are {active/inactive}'
    ],
    keywords: ['failed', 'unavailable', 'exceeds', 'degraded', 'backup', 'fault']
  },
  // Coordination patterns
  {
    category: ContextCategory.COORDINATION,
    patterns: [
      'When multiple controllers are {action}',
      'During handoff between {controller1} and {controller2}',
      'When communication with {entity} is lost',
      'While coordinating with {external_system}',
      'When authority transfer is in progress'
    ],
    keywords: ['multiple', 'handoff', 'communication', 'coordinating', 'authority']
  }
];

// UCA type-specific templates
const UCA_TYPE_TEMPLATES: Record<UCAType, string[]> = {
  [UCAType.NotProvided]: [
    'When {hazard_condition} is detected',
    'During emergency requiring immediate {action}',
    'When {critical_parameter} indicates need for {action}'
  ],
  [UCAType.ProvidedUnsafe]: [
    'When {precondition} has not been met',
    'While {conflicting_action} is already in progress',
    'When system state makes {action} hazardous'
  ],
  [UCAType.TooEarly]: [
    'Before {prerequisite} has been established',
    'When {required_condition} is not yet satisfied',
    'Prior to {initialization/stabilization} completion'
  ],
  [UCAType.TooLate]: [
    'After {critical_time} has elapsed',
    'When {time_window} for safe action has passed',
    'Following {delay} in response to {trigger}'
  ],
  [UCAType.WrongOrder]: [
    'When performed before {required_action}',
    'If executed after {dependent_action}',
    'When sequence {expected_sequence} is violated'
  ],
  [UCAType.TooLong]: [
    'When applied for more than {duration}',
    'If sustained beyond {safe_limit}',
    'When continuous application exceeds {threshold}'
  ],
  [UCAType.TooShort]: [
    'When discontinued before {minimum_duration}',
    'If terminated prematurely before {completion}',
    'When insufficient duration for {desired_effect}'
  ]
};

/**
 * Smart Context Builder Engine
 */
export class SmartContextBuilder {
  private learningData: Map<string, ContextSuggestion[]> = new Map();

  /**
   * Generate context suggestions for a UCA
   */
  generateUCASuggestions(
    uca: Partial<UnsafeControlAction>,
    controller: Controller,
    action: ControlAction,
    hazards: Hazard[],
    existingUCAs: UnsafeControlAction[]
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    // 1. Type-specific templates
    if (uca.ucaType) {
      suggestions.push(...this.generateTypeBasedSuggestions(uca.ucaType, controller, action));
    }

    // 2. Pattern-based suggestions
    suggestions.push(...this.generatePatternBasedSuggestions(controller, action));

    // 3. Similar UCA analysis
    suggestions.push(...this.analyzeSimilarUCAs(controller, action, existingUCAs));

    // 4. Hazard-based suggestions
    if (uca.hazardIds && uca.hazardIds.length > 0) {
      const linkedHazards = hazards.filter(h => uca.hazardIds!.includes(h.id));
      suggestions.push(...this.generateHazardBasedSuggestions(linkedHazards, controller, action));
    }

    // 5. Controller-type specific suggestions
    suggestions.push(...this.generateControllerSpecificSuggestions(controller, action));

    // Remove duplicates and sort by confidence
    return this.deduplicateAndRank(suggestions);
  }

  /**
   * Generate context suggestions for a UCCA
   */
  generateUCCASuggestions(
    ucca: Partial<UCCA>,
    controllers: Controller[],
    hazards: Hazard[]
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    // 1. Multi-controller coordination patterns
    suggestions.push(...this.generateCoordinationSuggestions(controllers));

    // 2. Temporal relationship patterns
    if (ucca.temporalRelationship) {
      suggestions.push(...this.generateTemporalRelationshipSuggestions(
        ucca.temporalRelationship,
        controllers
      ));
    }

    // 3. UCCA type-specific patterns
    if (ucca.uccaType) {
      suggestions.push(...this.generateUCCATypeSpecificSuggestions(ucca.uccaType, controllers));
    }

    // 4. Hazard-based multi-controller suggestions
    if (ucca.hazardIds && ucca.hazardIds.length > 0) {
      const linkedHazards = hazards.filter(h => ucca.hazardIds!.includes(h.id));
      suggestions.push(...this.generateMultiControllerHazardSuggestions(
        linkedHazards,
        controllers
      ));
    }

    return this.deduplicateAndRank(suggestions);
  }

  /**
   * Generate type-based suggestions
   */
  private generateTypeBasedSuggestions(
    ucaType: UCAType,
    controller: Controller,
    action: ControlAction
  ): ContextSuggestion[] {
    const templates = UCA_TYPE_TEMPLATES[ucaType] || [];
    
    return templates.map((template, index) => ({
      id: `type-${ucaType}-${index}`,
      text: this.fillTemplate(template, { controller, action }),
      confidence: 0.8,
      category: this.categorizeTemplate(template),
      source: SuggestionSource.PATTERN,
      keywords: this.extractKeywords(template),
      applicableTypes: [ucaType]
    }));
  }

  /**
   * Generate pattern-based suggestions
   */
  private generatePatternBasedSuggestions(
    controller: Controller,
    action: ControlAction
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];
    const actionText = `${action.verb} ${action.object}`.toLowerCase();

    CONTEXT_PATTERNS.forEach(categoryPatterns => {
      // Find relevant patterns based on action keywords
      const relevantPatterns = categoryPatterns.patterns.filter(pattern => {
        return categoryPatterns.keywords.some(keyword => 
          actionText.includes(keyword) || pattern.toLowerCase().includes(keyword)
        );
      });

      relevantPatterns.forEach((pattern, index) => {
        suggestions.push({
          id: `pattern-${categoryPatterns.category}-${index}`,
          text: this.fillTemplate(pattern, { controller, action }),
          confidence: 0.7,
          category: categoryPatterns.category,
          source: SuggestionSource.PATTERN,
          keywords: categoryPatterns.keywords
        });
      });
    });

    return suggestions;
  }

  /**
   * Analyze similar UCAs for context patterns
   */
  private analyzeSimilarUCAs(
    controller: Controller,
    action: ControlAction,
    existingUCAs: UnsafeControlAction[]
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    // Find UCAs with similar controllers or actions
    const similarUCAs = existingUCAs.filter(uca => 
      uca.controllerId === controller.id ||
      this.areActionsSimilar(
        action,
        { verb: uca.controlActionId, object: '' } // Simplified comparison
      )
    );

    // Extract context patterns from similar UCAs
    const contextPatterns = this.extractContextPatterns(similarUCAs);
    
    contextPatterns.forEach((pattern, index) => {
      if (pattern.count >= 2) { // Only suggest patterns that appear multiple times
        suggestions.push({
          id: `similar-${index}`,
          text: pattern.template,
          confidence: Math.min(0.9, 0.5 + (pattern.count * 0.1)),
          category: this.categorizeTemplate(pattern.template),
          source: SuggestionSource.SIMILAR_UCA,
          keywords: this.extractKeywords(pattern.template)
        });
      }
    });

    return suggestions;
  }

  /**
   * Generate hazard-based suggestions
   */
  private generateHazardBasedSuggestions(
    hazards: Hazard[],
    _controller: Controller,
    _action: ControlAction
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    hazards.forEach((hazard, _index) => {
      const hazardKeywords = this.extractKeywords(hazard.title);
      
      // Generate context that links the action to hazard conditions
      const templates = [
        `When conditions leading to ${hazard.title} are present`,
        `During situations where ${hazard.title} risk is elevated`,
        `When system state could contribute to ${hazard.title}`
      ];

      templates.forEach((template, tIndex) => {
        suggestions.push({
          id: `hazard-${hazard.id}-${tIndex}`,
          text: template,
          confidence: 0.75,
          category: ContextCategory.SYSTEM_STATE,
          source: SuggestionSource.HAZARD_BASED,
          keywords: hazardKeywords
        });
      });
    });

    return suggestions;
  }

  /**
   * Generate controller-specific suggestions
   */
  private generateControllerSpecificSuggestions(
    controller: Controller,
    action: ControlAction
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    switch (controller.ctrlType) {
      case ControllerType.Human:
        suggestions.push(...this.generateHumanControllerSuggestions(controller, action));
        break;
      case ControllerType.Software:
        suggestions.push(...this.generateSoftwareControllerSuggestions(controller, action));
        break;
      case ControllerType.Team:
        suggestions.push(...this.generateTeamControllerSuggestions(controller, action));
        break;
      case ControllerType.Organisation:
        suggestions.push(...this.generateOrganizationalSuggestions(controller, action));
        break;
    }

    return suggestions;
  }

  /**
   * Human controller specific suggestions
   */
  private generateHumanControllerSuggestions(
    controller: Controller,
    _action: ControlAction
  ): ContextSuggestion[] {
    return [
      {
        id: 'human-1',
        text: `When ${controller.name} is experiencing high workload`,
        confidence: 0.7,
        category: ContextCategory.OPERATIONAL,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['workload', 'stress', 'fatigue']
      },
      {
        id: 'human-2',
        text: `During shift change or handover periods`,
        confidence: 0.6,
        category: ContextCategory.COORDINATION,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['shift', 'handover', 'transition']
      },
      {
        id: 'human-3',
        text: `When situational awareness is degraded`,
        confidence: 0.65,
        category: ContextCategory.OPERATIONAL,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['awareness', 'perception', 'attention']
      }
    ];
  }

  /**
   * Software controller specific suggestions
   */
  private generateSoftwareControllerSuggestions(
    controller: Controller,
    _action: ControlAction
  ): ContextSuggestion[] {
    return [
      {
        id: 'software-1',
        text: `When ${controller.name} is operating on stale or invalid data`,
        confidence: 0.75,
        category: ContextCategory.SYSTEM_STATE,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['data', 'stale', 'invalid', 'sensor']
      },
      {
        id: 'software-2',
        text: `During software mode transitions or reconfigurations`,
        confidence: 0.7,
        category: ContextCategory.MODAL,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['mode', 'transition', 'reconfiguration']
      },
      {
        id: 'software-3',
        text: `When algorithmic assumptions are violated`,
        confidence: 0.65,
        category: ContextCategory.SYSTEM_STATE,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['algorithm', 'assumption', 'logic']
      }
    ];
  }

  /**
   * Team controller specific suggestions
   */
  private generateTeamControllerSuggestions(
    _controller: Controller,
    _action: ControlAction
  ): ContextSuggestion[] {
    return [
      {
        id: 'team-1',
        text: `When team coordination protocols are not followed`,
        confidence: 0.8,
        category: ContextCategory.COORDINATION,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['coordination', 'protocol', 'communication']
      },
      {
        id: 'team-2',
        text: `During distributed decision-making scenarios`,
        confidence: 0.7,
        category: ContextCategory.COORDINATION,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['distributed', 'decision', 'consensus']
      }
    ];
  }

  /**
   * Organizational controller specific suggestions
   */
  private generateOrganizationalSuggestions(
    _controller: Controller,
    _action: ControlAction
  ): ContextSuggestion[] {
    return [
      {
        id: 'org-1',
        text: `When organizational policies conflict with operational needs`,
        confidence: 0.7,
        category: ContextCategory.OPERATIONAL,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['policy', 'conflict', 'procedure']
      },
      {
        id: 'org-2',
        text: `During resource constraints or budget limitations`,
        confidence: 0.65,
        category: ContextCategory.OPERATIONAL,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['resource', 'constraint', 'budget']
      }
    ];
  }

  /**
   * Generate coordination suggestions for UCCAs
   */
  private generateCoordinationSuggestions(controllers: Controller[]): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];
    const controllerNames = controllers.map(c => c.name).join(' and ');

    suggestions.push({
      id: 'coord-1',
      text: `When ${controllerNames} have conflicting objectives or priorities`,
      confidence: 0.8,
      category: ContextCategory.COORDINATION,
      source: SuggestionSource.PATTERN,
      keywords: ['conflicting', 'objectives', 'priorities']
    });

    suggestions.push({
      id: 'coord-2',
      text: `During handoff or transition of control between ${controllerNames}`,
      confidence: 0.75,
      category: ContextCategory.COORDINATION,
      source: SuggestionSource.PATTERN,
      keywords: ['handoff', 'transition', 'transfer']
    });

    if (controllers.some(c => c.ctrlType === ControllerType.Human) && 
        controllers.some(c => c.ctrlType === ControllerType.Software)) {
      suggestions.push({
        id: 'coord-3',
        text: `When human-automation interaction creates mode confusion`,
        confidence: 0.85,
        category: ContextCategory.MODAL,
        source: SuggestionSource.DOMAIN_KNOWLEDGE,
        keywords: ['automation', 'mode', 'confusion', 'interaction']
      });
    }

    return suggestions;
  }

  /**
   * Generate temporal relationship suggestions
   */
  private generateTemporalRelationshipSuggestions(
    relationship: string,
    _controllers: Controller[]
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    switch (relationship) {
      case 'Simultaneous':
        suggestions.push({
          id: 'temporal-sim-1',
          text: `When controllers act simultaneously without coordination`,
          confidence: 0.8,
          category: ContextCategory.TEMPORAL,
          source: SuggestionSource.TEMPORAL_LOGIC,
          keywords: ['simultaneous', 'concurrent', 'parallel']
        });
        break;

      case 'Sequential':
        suggestions.push({
          id: 'temporal-seq-1',
          text: `When expected action sequence is disrupted or reversed`,
          confidence: 0.75,
          category: ContextCategory.TEMPORAL,
          source: SuggestionSource.TEMPORAL_LOGIC,
          keywords: ['sequence', 'order', 'disrupted']
        });
        break;

      case 'Within-Timeframe':
        suggestions.push({
          id: 'temporal-time-1',
          text: `When actions occur outside the required time window`,
          confidence: 0.7,
          category: ContextCategory.TEMPORAL,
          source: SuggestionSource.TEMPORAL_LOGIC,
          keywords: ['timeframe', 'window', 'timing']
        });
        break;
    }

    return suggestions;
  }

  /**
   * Generate UCCA type-specific suggestions
   */
  private generateUCCATypeSpecificSuggestions(
    uccaType: string,
    _controllers: Controller[]
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    switch (uccaType) {
      case 'Team':
        suggestions.push({
          id: 'ucca-team-1',
          text: `When team members have different situational awareness`,
          confidence: 0.8,
          category: ContextCategory.COORDINATION,
          source: SuggestionSource.DOMAIN_KNOWLEDGE,
          keywords: ['team', 'awareness', 'situation']
        });
        break;

      case 'Role':
        suggestions.push({
          id: 'ucca-role-1',
          text: `When role boundaries are unclear or overlapping`,
          confidence: 0.75,
          category: ContextCategory.COORDINATION,
          source: SuggestionSource.DOMAIN_KNOWLEDGE,
          keywords: ['role', 'boundary', 'authority']
        });
        break;

      case 'Cross-Controller':
        suggestions.push({
          id: 'ucca-cross-1',
          text: `When cross-controller dependencies are not properly managed`,
          confidence: 0.7,
          category: ContextCategory.COORDINATION,
          source: SuggestionSource.DOMAIN_KNOWLEDGE,
          keywords: ['dependency', 'interface', 'coordination']
        });
        break;
    }

    return suggestions;
  }

  /**
   * Generate multi-controller hazard suggestions
   */
  private generateMultiControllerHazardSuggestions(
    hazards: Hazard[],
    _controllers: Controller[]
  ): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    hazards.forEach(hazard => {
      suggestions.push({
        id: `multi-hazard-${hazard.id}`,
        text: `When unsafe combinations of control actions by multiple controllers contribute to ${hazard.title}`,
        confidence: 0.8,
        category: ContextCategory.COORDINATION,
        source: SuggestionSource.HAZARD_BASED,
        keywords: [...this.extractKeywords(hazard.title), 'unsafe combinations', 'multiple']
      });
    });

    return suggestions;
  }

  /**
   * Utility methods
   */
  private fillTemplate(template: string, data: { controller?: Controller; action?: ControlAction }): string {
    let filled = template;
    
    // Replace common placeholders
    const replacements: Record<string, string> = {
      '{controller}': data.controller?.name || 'controller',
      '{action}': data.action ? `${data.action.verb} ${data.action.object}` : 'action',
      '{phase}': 'operational',
      '{condition}': 'specific conditions',
      '{prerequisite}': 'required precondition',
      '{duration}': 'extended period',
      '{state1}': 'normal',
      '{state2}': 'emergency',
      '{mode}': 'automated',
      '{configuration}': 'standard',
      '{subsystem}': 'critical subsystem',
      '{state}': 'degraded',
      '{weather}': 'adverse weather',
      '{threshold}': 'minimum threshold',
      '{component}': 'critical component',
      '{sensor}': 'primary sensor',
      '{parameter}': 'safety parameter',
      '{system}': 'navigation system',
      '{entity}': 'ground control',
      '{external_system}': 'traffic control',
      '{hazard_condition}': 'hazardous condition',
      '{critical_parameter}': 'altitude',
      '{precondition}': 'safety check',
      '{conflicting_action}': 'opposing maneuver',
      '{critical_time}': 'response deadline',
      '{time_window}': 'safe operational window',
      '{delay}': 'significant delay',
      '{trigger}': 'warning signal',
      '{required_action}': 'system initialization',
      '{dependent_action}': 'confirmation',
      '{expected_sequence}': 'standard procedure',
      '{safe_limit}': 'operational limit',
      '{minimum_duration}': 'required duration',
      '{completion}': 'full effect',
      '{desired_effect}': 'stabilization'
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      filled = filled.replace(new RegExp(placeholder, 'g'), value);
    });

    return filled;
  }

  private categorizeTemplate(template: string): ContextCategory {
    const lowerTemplate = template.toLowerCase();
    
    if (/during|before|after|while|within|when/.test(lowerTemplate)) {
      return ContextCategory.TEMPORAL;
    }
    if (/mode|configuration|state/.test(lowerTemplate)) {
      return ContextCategory.MODAL;
    }
    if (/weather|visibility|environmental/.test(lowerTemplate)) {
      return ContextCategory.ENVIRONMENTAL;
    }
    if (/failed|degraded|exceeds|backup/.test(lowerTemplate)) {
      return ContextCategory.SYSTEM_STATE;
    }
    if (/multiple|handoff|communication|coordinating/.test(lowerTemplate)) {
      return ContextCategory.COORDINATION;
    }
    
    return ContextCategory.OPERATIONAL;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'been', 'be',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'shall', 'can',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return Array.from(new Set(words));
  }

  private areActionsSimilar(action1: ControlAction, action2: { verb: string; object: string }): boolean {
    const verb1 = action1.verb.toLowerCase();
    const verb2 = action2.verb.toLowerCase();
    const object1 = action1.object.toLowerCase();
    const object2 = action2.object.toLowerCase();

    // Check for exact match
    if (verb1 === verb2 && object1 === object2) return true;

    // Check for verb synonyms
    const verbSynonyms: Record<string, string[]> = {
      'activate': ['enable', 'start', 'turn on', 'engage'],
      'deactivate': ['disable', 'stop', 'turn off', 'disengage'],
      'increase': ['raise', 'boost', 'elevate'],
      'decrease': ['lower', 'reduce', 'diminish'],
      'monitor': ['watch', 'observe', 'track'],
      'control': ['manage', 'regulate', 'govern']
    };

    for (const [base, synonyms] of Object.entries(verbSynonyms)) {
      if ((verb1 === base || synonyms.includes(verb1)) &&
          (verb2 === base || synonyms.includes(verb2))) {
        return true;
      }
    }

    // Check for partial object match
    if (object1.includes(object2) || object2.includes(object1)) {
      return true;
    }

    return false;
  }

  private extractContextPatterns(ucas: UnsafeControlAction[]): Array<{ template: string; count: number }> {
    const patternCounts = new Map<string, number>();

    ucas.forEach(uca => {
      if (uca.context) {
        // Extract pattern by replacing specific values with placeholders
        const pattern = uca.context
          .replace(/\b\d+(\.\d+)?\s*(seconds?|minutes?|hours?|ms)\b/gi, '{duration}')
          .replace(/\b(high|low|critical|normal|emergency)\s+\w+/gi, '{level} $1')
          .replace(/\b(controller|operator|pilot|system)\s+\w+/gi, '{actor}')
          .trim();

        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      }
    });

    return Array.from(patternCounts.entries())
      .map(([template, count]) => ({ template, count }))
      .sort((a, b) => b.count - a.count);
  }

  private deduplicateAndRank(suggestions: ContextSuggestion[]): ContextSuggestion[] {
    // Remove exact duplicates
    const unique = new Map<string, ContextSuggestion>();
    
    suggestions.forEach(suggestion => {
      const key = suggestion.text.toLowerCase();
      const existing = unique.get(key);
      
      if (!existing || suggestion.confidence > existing.confidence) {
        unique.set(key, suggestion);
      }
    });

    // Sort by confidence
    return Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Return top 10 suggestions
  }

  /**
   * Learn from user selections to improve future suggestions
   */
  recordSelection(suggestionId: string, accepted: boolean): void {
    // In a real implementation, this would update ML models or pattern weights
    // For now, we'll just track it
    const key = accepted ? 'accepted' : 'rejected';
    if (!this.learningData.has(key)) {
      this.learningData.set(key, []);
    }
    
    // Store for future analysis
    console.log(`Context suggestion ${suggestionId} was ${accepted ? 'accepted' : 'rejected'}`);
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): { totalSuggestions: number; acceptanceRate: number } {
    const accepted = this.learningData.get('accepted')?.length || 0;
    const rejected = this.learningData.get('rejected')?.length || 0;
    const total = accepted + rejected;

    return {
      totalSuggestions: total,
      acceptanceRate: total > 0 ? accepted / total : 0
    };
  }
}

// Export singleton instance
export const smartContextBuilder = new SmartContextBuilder();