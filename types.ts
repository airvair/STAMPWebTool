export enum AnalysisType {
  CAST = 'CAST',
  STPA = 'STPA',
}

export enum ControllerType {
  Software = 'S',
  Human = 'H',
  Team = 'T',
  Organisation = 'O',
}

export enum ComponentType {
  Physical = 'Physical',
  Process = 'Process',
}

export enum UCAType {
  NotProvided = 'Not Provided', // When needed
  ProvidedUnsafe = 'Provided Unsafe/Incorrectly/Excess', // Includes providing but not enough or too much
  TooEarly = 'Too Early (unsafe timing/order)',
  TooLate = 'Too Late (unsafe timing/order)',
  WrongOrder = 'Wrong Order (relative to other actions)', // Specifically for order if distinct from early/late
  TooLong = 'Applied Too Long / Stopped Too Late (wrong duration)',
  TooShort = 'Applied Too Short / Stopped Too Soon (wrong duration)',
}

// Based on OCR Figure pg 29
export enum ScenarioClass {
  Class1 = '1', // Scenario: Unsafe control action (UCA) provided that leads to a hazard. Controller’s process model is flawed, or feedback is inadequate/incorrect. (UNSAFE + GOOD diagram)
  Class2 = '2', // Scenario: Controller provides UCA because its algorithm (Process Model) is flawed but it thinks it is preventing a hazard (or providing a safe CA) (UNSAFE + UNSAFE diagram)
  Class3 = '3', // Scenario: Safe CA provided but inadequately executed or modified by the controlled process (GOOD + UNSAFE diagram) - this definition is more aligned with STPA Class 3 of UCA
  Class4 = '4', // Scenario: Safe CA provided, correctly executed, but leads to hazard due to system state changes or other CAs. (GOOD + GOOD -> UNSAFE system state) - this definition is more aligned with STPA Class 4 of UCA
}
// Note: The OCR pg 29 diagram labels seem to correspond to:
// Class 1: Feedback -> UNSAFE Action (Controller thinks feedback is GOOD, but provides UNSAFE action, implies flawed process model or flawed understanding of feedback)
// Class 2: Feedback -> UNSAFE Action (Controller thinks feedback is UNSAFE, provides UNSAFE action to 'correct' it, implies flawed process model)
// Class 3: Feedback -> GOOD Action by controller, but process execution makes it UNSAFE
// Class 4: Feedback -> GOOD Action by controller, process executes it as GOOD, but system context + this action leads to hazard.
// The textual definitions in original STPA handbook are often more nuanced. For this tool, classType is a tag.

export interface Identifiable {
  id: string;
}

export interface AnalysisSession extends Identifiable {
  analysisType: AnalysisType | null;
  title: string;
  createdBy: string; // User ID or name
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  currentStep: string; // e.g., '/cast/step2'
  scope?: string;
}

export interface EventDetail extends Identifiable {
  description: string;
  order: number;
}

export interface Loss extends Identifiable {
  code: string; // L-1, L-2
  title: string;
  description: string;
  rationale?: string;
  isStandard?: boolean; // To differentiate standard from 'Other'
}

export interface Hazard extends Identifiable {
  code: string; // H-1, H-2
  title: string; // Generated template: <System Component> <Environmental Condition> when <System State>
  systemComponent: string;
  environmentalCondition: string;
  systemState: string;
  linkedLossIds: string[];
  parentHazardId?: string; // For sub-hazards
  subHazardDetails?: string; // User-defined text for the sub-hazard
}

export interface SystemConstraint extends Identifiable {
  code: string; // SC-1, SC-2
  text: string;
  hazardId: string; // Links to the hazard it inverts
  shallNotMustNot?: 'shall not' | 'must not'; // For STPA
}

export interface SystemComponent extends Identifiable {
  name: string;
  type: ComponentType;
  description?: string;
  // For graphical layout (future)
  x?: number;
  y?: number;
}

export type FiveFactorArchetype = 'GeneralPopulation' | 'CommercialPilot' | 'MilitaryPilot' | 'Custom';
export interface FiveFactorScores {
  neuroticism: number; // 0-5 scale
  extraversion: number;
  openness: number;
  agreeableness: number;
  conscientiousness: number;
}

export interface Controller extends Identifiable {
  name: string;
  ctrlType: ControllerType;
  description?: string; // General description
  responsibilities?: string; // Text field for responsibilities
  teamDetails?: string; // For Type T: roles, structure, command gradient
  orgDetails?: string; // For Type O: departments, hierarchy info
  fiveFactorArchetype?: FiveFactorArchetype;
  customFiveFactorScores?: FiveFactorScores;
  // For graphical layout (future)
  x?: number;
  y?: number;
}

export interface ControlPath extends Identifiable {
  sourceControllerId: string;
  targetId: string; // Could be SystemComponent or another Controller
  controls: string; // Comma-separated or list of control actions text (e.g., "Throttle command, Steering angle")
  higherAuthority?: boolean; // Does the target controller have higher authority than the source?
  actuatorLabel?: string; // e.g., "Actuator"
}

export interface FeedbackPath extends Identifiable {
  sourceId: string; // Could be SystemComponent or another Controller
  targetControllerId: string;
  feedback: string; // Comma-separated or list of sensor/feedback text (e.g., "Speedometer reading, GPS position")
  isMissing: boolean;
  indirect?: boolean; // Is the feedback indirect via another controller?
  sensorLabel?: string; // e.g., "Sensor"
}

export interface ControlAction extends Identifiable {
  controllerId: string;
  verb: string;
  object: string; 
  description: string; // Context or refinement of the action
  isOutOfScope: boolean;
  // For refinement:
  // parentControlActionId?: string; 
  // refinedActions?: ControlAction[]; // if this action is a category
}

export interface UnsafeControlAction extends Identifiable {
  controllerId: string; // ID of the controller providing the CA
  controlActionId: string;
  ucaType: UCAType;
  context: string; // Circumstances making it unsafe
  hazardIds: string[];
  code: string; // UCA-1, UCA-2, etc.
}

// Unsafe Combination of Control Actions
export interface UCCA extends Identifiable {
  code: string; // UCCA-1, UCCA-2
  // For simplicity, allow free text definition based on OCR templates
  // For more structured approach:
  // involvedControllerIds: string[];
  // controlActionInteractions: Array<{controlActionId: string, controllerId: string, timing: string}>;
  description: string; // User describes the unsafe combination, context, and timing
  context: string;
  hazardIds: string[];
}


export interface CausalScenario extends Identifiable {
  ucaId: string; // Links to UCA or UCCA
  classType: ScenarioClass; 
  description: string; // Detailed user text, guided by checklists
  isAdditional?: boolean; // For "Additional causal scenario" free-text
  // To store specific checklist item states if a more granular data model is adopted later:
  // causalFactorChecklistItems?: { [factorKey: string]: { checked: boolean; details: string } };
}

export interface Requirement extends Identifiable {
  text: string;
  linkedScenarioIds: string[]; // Many-to-many with Scenarios
  type: 'Requirement' | 'Mitigation'; // Determined by AnalysisType
}

// For navigation and stepper
export interface StepDefinition {
  path: string;
  title: string;
  shortTitle: string;
}

// For Causal Scenario Checklists in Step 6
export interface ScenarioChecklistItem {
  id: string; // e.g., "software.hardware_failure.power_loss"
  label: string;
  userText?: string; // For "Describe scenario: USER"
  checked?: boolean; // If it's a direct checkbox item
  subItems?: ScenarioChecklistItem[]; // For nested checklists
  tooltip?: string; // Additional guidance
  relevantControllerTypes?: ControllerType[];
  relevantScenarioClasses?: ScenarioClass[];
}
