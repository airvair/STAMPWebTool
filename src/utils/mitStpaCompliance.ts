import { Controller, ControlAction, UnsafeControlAction, UCCA, Hazard, UCAType } from '@/types/types';
import { ValidationResult, ValidationError, ValidationWarning, generateComplianceReport } from './ucaValidation';

// MIT STPA 4-Step Process Implementation
// Based on MIT's Systems-Theoretic Process Analysis methodology

export interface StpaStep {
  id: number;
  name: string;
  description: string;
  required: boolean;
  dependencies: number[];
}

export interface StpaComplianceState {
  step1Complete: boolean; // Accidents and hazards defined
  step2Complete: boolean; // Control structure modeled
  step3Complete: boolean; // Control actions identified
  step4Complete: boolean; // UCAs identified
  overallCompliance: number; // 0-100 percentage
}

export interface SystematicCompletenessCheck {
  totalExpectedUCAs: number;
  actualUCAs: number;
  completenessPercentage: number;
  missingCombinations: {
    controllerId: string;
    controlActionId: string;
    ucaType: UCAType;
    reason: string;
  }[];
  qualityIssues: {
    ucaId: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

// MIT STPA 4-Step Process Definition
export const MIT_STPA_STEPS: StpaStep[] = [
  {
    id: 1,
    name: "Define Accidents and Hazards",
    description: "Identify potential accidents and system-level hazards that could lead to losses",
    required: true,
    dependencies: []
  },
  {
    id: 2,
    name: "Model Control Structure", 
    description: "Create hierarchical model of system controllers, controlled processes, and feedback paths",
    required: true,
    dependencies: [1]
  },
  {
    id: 3,
    name: "Identify Control Actions",
    description: "Determine all control actions between controllers and controlled processes",
    required: true,
    dependencies: [1, 2]
  },
  {
    id: 4,
    name: "Identify Unsafe Control Actions",
    description: "Systematically analyze each control action for the 4 UCA types",
    required: true,
    dependencies: [1, 2, 3]
  }
];

/**
 * Validates MIT STPA 4-step process compliance
 */
export const validateMitStpaCompliance = (
  hazards: Hazard[],
  controllers: Controller[],
  controlActions: ControlAction[],
  ucas: UnsafeControlAction[]
): StpaComplianceState => {
  // Step 1: Check if hazards are defined
  const step1Complete = hazards.length > 0;

  // Step 2: Check if control structure is modeled (controllers exist)
  const step2Complete = controllers.length >= 2; // Minimum meaningful control structure

  // Step 3: Check if control actions are identified
  const inScopeActions = controlActions.filter(ca => !ca.isOutOfScope);
  const step3Complete = inScopeActions.length > 0;

  // Step 4: Check systematic UCA coverage
  const expectedUCACombinations = inScopeActions.length * 4; // 4 UCA types per action
  const step4Complete = ucas.length >= expectedUCACombinations * 0.6; // At least 60% coverage

  const completedSteps = [step1Complete, step2Complete, step3Complete, step4Complete]
    .filter(Boolean).length;
  
  const overallCompliance = (completedSteps / 4) * 100;

  return {
    step1Complete,
    step2Complete,
    step3Complete,
    step4Complete,
    overallCompliance
  };
};

/**
 * Performs systematic completeness check for UCA analysis
 */
export const performSystematicCompletenessCheck = (
  controllers: Controller[],
  controlActions: ControlAction[],
  ucas: UnsafeControlAction[],
  hazards: Hazard[]
): SystematicCompletenessCheck => {
  const inScopeActions = controlActions.filter(ca => !ca.isOutOfScope);
  const ucaTypes: UCAType[] = [
    UCAType.NotProvided, 
    UCAType.ProvidedUnsafe, 
    UCAType.TooEarly, 
    UCAType.TooLate,
    UCAType.WrongOrder,
    UCAType.TooLong,
    UCAType.TooShort
  ];
  
  // Calculate expected vs actual UCAs
  const totalExpectedUCAs = inScopeActions.length * ucaTypes.length;
  const actualUCAs = ucas.length;
  const completenessPercentage = totalExpectedUCAs > 0 ? 
    (actualUCAs / totalExpectedUCAs) * 100 : 100;

  // Find missing combinations
  const missingCombinations: SystematicCompletenessCheck['missingCombinations'] = [];
  
  for (const action of inScopeActions) {
    for (const ucaType of ucaTypes) {
      const existingUCA = ucas.find(u => 
        u.controlActionId === action.id && u.ucaType === ucaType
      );
      
      if (!existingUCA) {
        const controller = controllers.find(c => c.id === action.controllerId);
        missingCombinations.push({
          controllerId: action.controllerId,
          controlActionId: action.id,
          ucaType,
          reason: `No UCA of type "${ucaType}" for action "${action.verb} ${action.object}" (Controller: ${controller?.name || 'Unknown'})`
        });
      }
    }
  }

  // Identify quality issues
  const qualityIssues: SystematicCompletenessCheck['qualityIssues'] = [];
  
  for (const uca of ucas) {
    // Check context quality
    if (uca.context.length < 20) {
      qualityIssues.push({
        ucaId: uca.id,
        issue: 'Context too brief - may lack specificity',
        severity: 'medium'
      });
    }

    // Check vague language
    const vagueTerms = ['sometimes', 'maybe', 'might', 'could', 'possibly'];
    if (vagueTerms.some(term => uca.context.toLowerCase().includes(term))) {
      qualityIssues.push({
        ucaId: uca.id,
        issue: 'Context contains vague language - not measurable',
        severity: 'high'
      });
    }

    // Check hazard linkage
    if (uca.hazardIds.length === 0) {
      qualityIssues.push({
        ucaId: uca.id,
        issue: 'No hazard linkage - violates MIT STPA requirement',
        severity: 'high'
      });
    }

    // Check for orphaned hazard references
    const invalidHazardIds = uca.hazardIds.filter(hId => 
      !hazards.find(h => h.id === hId)
    );
    if (invalidHazardIds.length > 0) {
      qualityIssues.push({
        ucaId: uca.id,
        issue: `References invalid hazards: ${invalidHazardIds.join(', ')}`,
        severity: 'high'
      });
    }
  }

  return {
    totalExpectedUCAs,
    actualUCAs,
    completenessPercentage,
    missingCombinations,
    qualityIssues
  };
};

/**
 * Generates recommendations for improving MIT STPA compliance
 */
export const generateStpaRecommendations = (
  complianceState: StpaComplianceState,
  completenessCheck: SystematicCompletenessCheck
): string[] => {
  const recommendations: string[] = [];

  // Step-specific recommendations
  if (!complianceState.step1Complete) {
    recommendations.push("Define system hazards that could lead to accidents - this is fundamental to STPA");
  }

  if (!complianceState.step2Complete) {
    recommendations.push("Model the complete control structure with at least 2 controllers for meaningful analysis");
  }

  if (!complianceState.step3Complete) {
    recommendations.push("Identify and document all control actions between controllers and controlled processes");
  }

  if (!complianceState.step4Complete) {
    recommendations.push("Systematically analyze each control action for all 4 UCA types (Not Provided, Provided, Too Early, Too Late)");
  }

  // Completeness recommendations
  if (completenessCheck.completenessPercentage < 80) {
    recommendations.push(`Analysis is ${completenessCheck.completenessPercentage.toFixed(1)}% complete. MIT STPA requires systematic coverage of all control actions.`);
  }

  if (completenessCheck.missingCombinations.length > 0) {
    const topMissing = completenessCheck.missingCombinations.slice(0, 3);
    recommendations.push(`Missing UCAs for: ${topMissing.map(m => m.reason).join('; ')}`);
  }

  // Quality recommendations
  const highSeverityIssues = completenessCheck.qualityIssues.filter(q => q.severity === 'high');
  if (highSeverityIssues.length > 0) {
    recommendations.push(`${highSeverityIssues.length} high-severity quality issues need attention (vague contexts, missing hazard links)`);
  }

  const mediumSeverityIssues = completenessCheck.qualityIssues.filter(q => q.severity === 'medium');
  if (mediumSeverityIssues.length > 5) {
    recommendations.push(`${mediumSeverityIssues.length} UCAs have brief contexts - consider adding more specific conditions`);
  }

  // Positive feedback
  if (complianceState.overallCompliance >= 90) {
    recommendations.push("✅ Excellent MIT STPA compliance! Your analysis follows systematic methodology.");
  } else if (complianceState.overallCompliance >= 70) {
    recommendations.push("✅ Good progress on MIT STPA methodology. Address remaining gaps for full compliance.");
  }

  return recommendations;
};

/**
 * Validates step dependencies are met
 */
export const validateStepDependencies = (
  stepId: number,
  complianceState: StpaComplianceState
): ValidationResult => {
  const step = MIT_STPA_STEPS.find(s => s.id === stepId);
  if (!step) {
    return {
      valid: false,
      errors: [{ code: 'STEP-001', message: 'Invalid step ID', severity: 'critical' }],
      warnings: [],
      confidence: 0
    };
  }

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check dependencies
  for (const depId of step.dependencies) {
    let depMet = false;
    
    switch (depId) {
      case 1:
        depMet = complianceState.step1Complete;
        break;
      case 2:
        depMet = complianceState.step2Complete;
        break;
      case 3:
        depMet = complianceState.step3Complete;
        break;
      case 4:
        depMet = complianceState.step4Complete;
        break;
    }

    if (!depMet) {
      const depStep = MIT_STPA_STEPS.find(s => s.id === depId);
      errors.push({
        code: 'STEP-DEP',
        message: `Step ${stepId} requires completion of Step ${depId}: ${depStep?.name}`,
        severity: 'high'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence: errors.length === 0 ? 1.0 : 0
  };
};

/**
 * Export systematic analysis report
 */
export const generateSystematicAnalysisReport = (
  controllers: Controller[],
  controlActions: ControlAction[],
  ucas: UnsafeControlAction[],
  uccas: UCCA[],
  hazards: Hazard[]
) => {
  const compliance = validateMitStpaCompliance(hazards, controllers, controlActions, ucas);
  const completeness = performSystematicCompletenessCheck(controllers, controlActions, ucas, hazards);
  const recommendations = generateStpaRecommendations(compliance, completeness);
  const detailedCompliance = generateComplianceReport(ucas, uccas, controllers, controlActions, hazards);

  return {
    timestamp: new Date().toISOString(),
    mitStpaCompliance: compliance,
    systematicCompleteness: completeness,
    recommendations,
    detailedMetrics: detailedCompliance,
    summary: {
      overallScore: Math.min(compliance.overallCompliance, completeness.completenessPercentage),
      readyForNextPhase: compliance.overallCompliance >= 80 && completeness.completenessPercentage >= 80,
      criticalIssues: completeness.qualityIssues.filter(q => q.severity === 'high').length,
      totalUCAs: ucas.length,
      totalUCCAs: uccas.length
    }
  };
};