import { Controller, ControlAction, UnsafeControlAction, UCCA, Hazard, UCAType } from '@/types';

// Enhanced validation framework for MIT STPA compliance
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number; // 0-1 scale
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

export interface ControllerActionAuthority {
  controllerId: string;
  authorizedActionIds: string[];
  restrictions: string[];
  authorityLevel: number; // 0-1 scale for partial authority
}

export interface ComplianceReport {
  mitStpaCompliance: boolean;
  systematicCompleteness: number; // 0-100 percentage
  traceabilityScore: number; // 0-100 percentage
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  contextSpecificity: number; // How specific are UCA contexts
  hazardCoverage: number; // Percentage of hazards addressed
  controllerCoverage: number; // Percentage of controllers analyzed
  ucaTypeCoverage: number; // Coverage across UCA types
}

/**
 * Validates controller authority for control actions
 * Critical for ensuring UCAs represent valid controller-action relationships
 */
export const validateControllerAuthority = (
  controllerId: string,
  actionId: string,
  controlActions: ControlAction[],
  authorities?: ControllerActionAuthority[]
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Find the control action
  const controlAction = controlActions.find(ca => ca.id === actionId);
  if (!controlAction) {
    errors.push({
      code: 'CA-001',
      message: 'Control action not found',
      field: 'actionId',
      severity: 'critical'
    });
    return { valid: false, errors, warnings, confidence: 0 };
  }

  // Check if controller is authorized for this action
  if (controlAction.controllerId !== controllerId) {
    errors.push({
      code: 'AUTH-001',
      message: `Controller ${controllerId} not authorized for action ${actionId}`,
      field: 'controllerId',
      severity: 'critical'
    });
  }

  // Check custom authority rules if provided
  if (authorities) {
    const authority = authorities.find(a => a.controllerId === controllerId);
    if (authority && !authority.authorizedActionIds.includes(actionId)) {
      errors.push({
        code: 'AUTH-002',
        message: `Controller authority rules prohibit action ${actionId}`,
        field: 'controllerId',
        severity: 'high'
      });
    }

    // Check for restrictions
    if (authority?.restrictions.length) {
      warnings.push({
        code: 'AUTH-003',
        message: `Controller has restrictions: ${authority.restrictions.join(', ')}`,
        field: 'controllerId',
        recommendation: 'Consider restriction impact on UCA context'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence: errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.8) : 0
  };
};

/**
 * Validates hazard traceability - critical MIT STPA requirement
 * Every UCA must be traceable to at least one hazard
 */
export const validateHazardTraceability = (
  uca: Partial<UnsafeControlAction>,
  hazards: Hazard[]
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // BR-5-HazSel: Must link to at least one hazard
  if (!uca.hazardIds || uca.hazardIds.length === 0) {
    errors.push({
      code: 'HAZ-001',
      message: 'BR-5-HazSel: UCA must be linked to at least one hazard',
      field: 'hazardIds',
      severity: 'critical'
    });
    return { valid: false, errors, warnings, confidence: 0 };
  }

  // Validate hazard existence
  const invalidHazardIds = uca.hazardIds.filter(hazardId => 
    !hazards.find(h => h.id === hazardId)
  );

  if (invalidHazardIds.length > 0) {
    errors.push({
      code: 'HAZ-002',
      message: `Invalid hazard IDs: ${invalidHazardIds.join(', ')}`,
      field: 'hazardIds',
      severity: 'high'
    });
  }

  // Check for logical relevance (basic heuristic)
  if (uca.context && uca.hazardIds.length > 0) {
    const linkedHazards = hazards.filter(h => uca.hazardIds!.includes(h.id));
    const contextKeywords = uca.context.toLowerCase().split(/\s+/);
    
    const relevantHazards = linkedHazards.filter(hazard => {
      const hazardKeywords = hazard.title.toLowerCase();
      return contextKeywords.some(keyword => 
        keyword.length > 3 && hazardKeywords.includes(keyword)
      );
    });

    if (relevantHazards.length === 0 && linkedHazards.length > 0) {
      warnings.push({
        code: 'HAZ-003',
        message: 'UCA context may not be relevant to linked hazards',
        field: 'context',
        recommendation: 'Verify logical connection between UCA context and hazards'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence: errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.7) : 0
  };
};

/**
 * Validates UCA context specificity - MIT requirement for measurable contexts
 */
export const validateContextSpecificity = (
  uca: Partial<UnsafeControlAction>
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!uca.context || !uca.context.trim()) {
    errors.push({
      code: 'CTX-001',
      message: 'UCA context is required',
      field: 'context',
      severity: 'critical'
    });
    return { valid: false, errors, warnings, confidence: 0 };
  }

  const context = uca.context.trim();

  // Check minimum length for specificity
  if (context.length < 20) {
    warnings.push({
      code: 'CTX-002',
      message: 'UCA context may be too brief to be specific',
      field: 'context',
      recommendation: 'Provide more detailed conditions for when this becomes unsafe'
    });
  }

  // Check for vague language
  const vagueTerms = ['sometimes', 'maybe', 'might', 'could', 'possibly', 'unclear'];
  const hasVagueLanguage = vagueTerms.some(term => 
    context.toLowerCase().includes(term)
  );

  if (hasVagueLanguage) {
    warnings.push({
      code: 'CTX-003',
      message: 'UCA context contains vague language',
      field: 'context',
      recommendation: 'Use specific, measurable conditions'
    });
  }

  // Check for specific conditions (good practices)
  const specificIndicators = ['when', 'during', 'if', 'while', 'after', 'before'];
  const hasSpecificConditions = specificIndicators.some(indicator =>
    context.toLowerCase().includes(indicator)
  );

  if (!hasSpecificConditions) {
    warnings.push({
      code: 'CTX-004',
      message: 'UCA context may lack specific conditions',
      field: 'context',
      recommendation: 'Include specific timing or situational conditions'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence: errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.8) : 0
  };
};

/**
 * Validates UCCA logical consistency
 */
export const validateUCCALogic = (
  ucca: Partial<UCCA>,
  controllers: Controller[],
  controlActions: ControlAction[]
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Must involve at least 2 controllers
  if (!ucca.involvedControllerIds || ucca.involvedControllerIds.length < 2) {
    errors.push({
      code: 'UCCA-001',
      message: 'UCCA must involve at least 2 controllers',
      field: 'involvedControllerIds',
      severity: 'critical'
    });
  }

  // Validate controller existence
  if (ucca.involvedControllerIds) {
    const invalidControllerIds = ucca.involvedControllerIds.filter(controllerId =>
      !controllers.find(c => c.id === controllerId)
    );

    if (invalidControllerIds.length > 0) {
      errors.push({
        code: 'UCCA-002',
        message: `Invalid controller IDs: ${invalidControllerIds.join(', ')}`,
        field: 'involvedControllerIds',
        severity: 'high'
      });
    }
  }

  // Validate temporal relationship consistency
  if (ucca.temporalRelationship === 'Sequential' && 
      ucca.involvedControllerIds && 
      ucca.involvedControllerIds.length < 2) {
    errors.push({
      code: 'UCCA-003',
      message: 'Sequential UCCAs require multiple controllers',
      field: 'temporalRelationship',
      severity: 'high'
    });
  }

  // Check that controllers have relevant control actions
  if (ucca.involvedControllerIds) {
    const controllersWithoutActions = ucca.involvedControllerIds.filter(controllerId => {
      const controllerActions = controlActions.filter(ca => 
        ca.controllerId === controllerId && !ca.isOutOfScope
      );
      return controllerActions.length === 0;
    });

    if (controllersWithoutActions.length > 0) {
      warnings.push({
        code: 'UCCA-004',
        message: `Controllers without in-scope actions: ${controllersWithoutActions.join(', ')}`,
        field: 'involvedControllerIds',
        recommendation: 'Ensure all involved controllers have relevant control actions'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence: errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.8) : 0
  };
};

/**
 * Comprehensive UCA validation combining all checks
 */
export const validateUCA = (
  uca: Partial<UnsafeControlAction>,
  _controllers: Controller[],
  controlActions: ControlAction[],
  hazards: Hazard[],
  authorities?: ControllerActionAuthority[]
): ValidationResult => {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  // Run all validation checks
  const validationChecks = [
    () => uca.controllerId && uca.controlActionId ? 
      validateControllerAuthority(uca.controllerId, uca.controlActionId, controlActions, authorities) :
      { valid: false, errors: [{ code: 'UCA-001', message: 'Controller and control action required', severity: 'critical' as const }], warnings: [], confidence: 0 },
    () => validateHazardTraceability(uca, hazards),
    () => validateContextSpecificity(uca)
  ];

  let overallConfidence = 1.0;
  let criticalErrorFound = false;

  validationChecks.forEach(check => {
    const result = check();
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    
    if (result.errors.some(e => e.severity === 'critical')) {
      criticalErrorFound = true;
    }
    
    overallConfidence = Math.min(overallConfidence, result.confidence);
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    confidence: criticalErrorFound ? 0 : overallConfidence
  };
};

/**
 * Generate compliance report for systematic completeness
 */
export const generateComplianceReport = (
  ucas: UnsafeControlAction[],
  _uccas: UCCA[],
  controllers: Controller[],
  controlActions: ControlAction[],
  hazards: Hazard[]
): ComplianceReport => {
  // Calculate systematic completeness
  const inScopeActions = controlActions.filter(ca => !ca.isOutOfScope);
  const ucaTypes = [UCAType.NotProvided, UCAType.ProvidedUnsafe, UCAType.TooEarly, UCAType.TooLate];
  
  const expectedUCACombinations = inScopeActions.length * ucaTypes.length;
  const actualUCACombinations = ucas.length;
  const systematicCompleteness = expectedUCACombinations > 0 ? 
    Math.min(100, (actualUCACombinations / expectedUCACombinations) * 100) : 100;

  // Calculate traceability score
  const ucasWithValidHazards = ucas.filter(uca => 
    uca.hazardIds.length > 0 && 
    uca.hazardIds.every(hazardId => hazards.find(h => h.id === hazardId))
  );
  const traceabilityScore = ucas.length > 0 ? 
    (ucasWithValidHazards.length / ucas.length) * 100 : 100;

  // Calculate quality metrics
  const contextsWithDetail = ucas.filter(uca => uca.context.length >= 20);
  const contextSpecificity = ucas.length > 0 ? 
    (contextsWithDetail.length / ucas.length) * 100 : 100;

  const addressedHazards = new Set(
    ucas.flatMap(uca => uca.hazardIds)
  );
  const hazardCoverage = hazards.length > 0 ? 
    (addressedHazards.size / hazards.length) * 100 : 100;

  const analyzedControllers = new Set(ucas.map(uca => uca.controllerId));
  const controllerCoverage = controllers.length > 0 ? 
    (analyzedControllers.size / controllers.length) * 100 : 100;

  const ucaTypeDistribution = new Set(ucas.map(uca => uca.ucaType));
  const ucaTypeCoverage = (ucaTypeDistribution.size / ucaTypes.length) * 100;

  return {
    mitStpaCompliance: systematicCompleteness >= 80 && traceabilityScore >= 95,
    systematicCompleteness,
    traceabilityScore,
    qualityMetrics: {
      contextSpecificity,
      hazardCoverage,
      controllerCoverage,
      ucaTypeCoverage
    }
  };
};

// Validation error codes for reference
export const VALIDATION_CODES = {
  // Controller Authority
  'CA-001': 'Control action not found',
  'AUTH-001': 'Controller not authorized for action',
  'AUTH-002': 'Authority rules prohibit action',
  'AUTH-003': 'Controller has restrictions',
  
  // Hazard Traceability
  'HAZ-001': 'UCA must link to at least one hazard',
  'HAZ-002': 'Invalid hazard IDs',
  'HAZ-003': 'Context may not be relevant to hazards',
  
  // Context Specificity
  'CTX-001': 'Context is required',
  'CTX-002': 'Context too brief',
  'CTX-003': 'Context contains vague language',
  'CTX-004': 'Context lacks specific conditions',
  
  // UCCA Logic
  'UCCA-001': 'Must involve at least 2 controllers',
  'UCCA-002': 'Invalid controller IDs',
  'UCCA-003': 'Sequential UCCAs need multiple controllers',
  'UCCA-004': 'Controllers without relevant actions',
  
  // General UCA
  'UCA-001': 'Controller and control action required'
} as const;