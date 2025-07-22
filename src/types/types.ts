// types.ts

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

export interface CommunicationPath {
  id: string;
  sourceControllerId: string;
  targetControllerId: string;
  description: string;
  sourceMemberId?: string; // NEW: For intra-team links
  targetMemberId?: string; // NEW: For intra-team links
}

// Alias for backward compatibility
export type CommunicationLink = CommunicationPath;

export enum UCAType {
  NotProvided = 'Not Provided',
  ProvidedUnsafe = 'Provided Unsafe/Incorrectly/Excess',
  TooEarly = 'Too Early (unsafe timing/order)',
  TooLate = 'Too Late (unsafe timing/order)',
  WrongOrder = 'Wrong Order (relative to other actions)',
  TooLong = 'Applied Too Long / Stopped Too Late (wrong duration)',
  TooShort = 'Applied Too Short / Stopped Too Soon (wrong duration)',
}


export interface Identifiable {
  id: string;
}

export interface AnalysisFolder extends Identifiable {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  parentFolderId?: string; // For nested folders
  isExpanded?: boolean;
}

export interface AnalysisSession extends Identifiable {
  analysisType: AnalysisType | null;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentStep: string;
  scope?: string;
  folderId?: string; // Optional folder assignment
}

export interface EventDetail extends Identifiable {
  description: string;
  order: number;
}

export interface Loss extends Identifiable {
  code: string;
  title: string;
  description: string;
  rationale?: string;
  isStandard?: boolean;
}

export interface Hazard extends Identifiable {
  code: string;
  title: string;
  systemComponent: string;
  environmentalCondition: string;
  systemState: string;
  linkedLossIds: string[];
  lossIds?: string[]; // Alternative property name used in some parts
  linkedLosses?: string[]; // Alternative property name used in some parts
  parentHazardId?: string;
  subHazardDetails?: string;
  severity?: string;
  systemCondition?: string; // Used in completenessChecker
}

export interface SystemConstraint extends Identifiable {
  code: string;
  text: string;
  hazardId: string;
  shallNotMustNot?: 'shall not' | 'must not';
}

export interface SystemComponent extends Identifiable {
  name: string;
  type: ComponentType;
  description?: string;
  x?: number;
  y?: number;
}

export type FiveFactorArchetype = 'GeneralPopulation' | 'CommercialPilot' | 'MilitaryPilot' | 'Custom';

export interface FiveFactorScores {
  neuroticism: number;
  extraversion: number;
  openness: number;
  agreeableness: number;
  conscientiousness: number;
}

// Interfaces for detailed team structures
export interface TeamMember extends Identifiable {
  name: string;
  commandRank: string; // e.g., 'CM-1', 'CM-2', 'GR'
}

export interface TeamRole extends Identifiable {
  name: string; // e.g., 'Pilot Flying', 'Pilot Monitoring'
  description?: string;
  authorityLevel?: number; // Lower number = higher authority in diagram
}

export interface RoleAssignment {
  memberId: string;
  roleId: string;
}

export interface OperationalContext extends Identifiable {
  name: string; // e.g., "Autopilot ON, Captain is PF"
  description?: string;
  assignments: RoleAssignment[];
}

export interface TeamDetails {
  isSingleUnit?: boolean;
  isHierarchical?: boolean;
  members: TeamMember[];
  roles: TeamRole[];
  contexts: OperationalContext[];
}


export interface Controller extends Identifiable {
  name: string;
  ctrlType: ControllerType;
  description?: string;
  responsibilities?: string;
  teamDetails?: TeamDetails;
  orgDetails?: string;
  fiveFactorArchetype?: FiveFactorArchetype;
  customFiveFactorScores?: FiveFactorScores;
  x?: number;
  y?: number;
  parentNode?: string; // ID of the parent controller for grouping
}

export interface ControlPath extends Identifiable {
  sourceControllerId: string;
  targetId: string;
  controls: string;
  higherAuthority?: boolean;
  actuatorLabel?: string;
}

export interface FeedbackPath extends Identifiable {
  sourceId: string;
  targetControllerId: string;
  feedback: string;
  isMissing: boolean;
  indirect?: boolean;
  sensorLabel?: string;
}

export interface ControlAction extends Identifiable {
  controllerId: string;
  controlPathId?: string; // Link to the ControlPath
  roleId?: string; // Link to a team role if the controller is a team
  verb: string;
  object: string;
  description: string;
  isOutOfScope: boolean;
  name?: string; // Alternative way to reference the action
  feedbackIds?: string[]; // Referenced in completenessChecker
}

export interface UnsafeControlAction extends Identifiable {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  context: string;
  hazardIds: string[];
  code: string;
  riskCategory: string;
  riskScore?: number;
  description?: string;
  linkedHazards?: string[];
}

// Causal Scenario types for Step 5
export interface CausalScenario extends Identifiable {
  code?: string;
  ucaId?: string;
  name?: string;
  title?: string;
  description: string;
  causalFactors: CausalFactor[];
  context?: string;
  hazardIds?: string[];
  scenarioType?: 'Design Flaws' | 'Component Failure' | 'Human Error' | 'Process Model Flaw' | 'Communication Failure';
  likelihood?: 'Low' | 'Medium' | 'High';
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  mitigationStrategy?: string;
  assumptions?: string[];
  factorInteractions?: string[]; // How factors combine
  safetyConstraints?: SafetyConstraint[]; // Prevention measures
}

export interface CausalFactor {
  id: string;
  type?: 'Physical' | 'Human' | 'Software' | 'Environmental' | 'Organizational';
  description: string;
  category: string;
  relatedComponentId?: string;
  details?: string; // Additional details about the factor
  relatedControllerId?: string;
}


export interface Requirement extends Identifiable {
  text: string;
  linkedScenarioIds: string[];
  scenarioIds?: string[]; // Alternative property name used in some parts
  linkedScenarios?: string[]; // Alternative property name used in some parts
  ucaIds?: string[]; // Link to UCAs this requirement addresses
  type: 'Requirement' | 'Mitigation';
  implementation?: string;
  code?: string;
  priority?: string;
  description?: string;
  verificationMethod?: string;
}

export interface StepDefinition {
  path: string;
  title: string;
  shortTitle: string;
}

export interface ScenarioChecklistItem {
  id: string;
  label: string;
  userText?: string;
  checked?: boolean;
  subItems?: ScenarioChecklistItem[];
  tooltip?: string;
  relevantControllerTypes?: ControllerType[];
}

export enum FailureType {
  MechanicalWear = 'Mechanical Wear',
  ElectricalFault = 'Electrical Fault',
  SensorDrift = 'Sensor Drift',
  ControlElectronics = 'Control Electronics',
  SoftwareGlitch = 'Software Glitch',
  StructuralFailure = 'Structural Failure',
  Other = 'Other',
}

export interface HardwareComponent extends Identifiable {
  name: string;
  type: string; // e.g., 'motor', 'gearbox', 'sensor', 'actuator', 'controller', 'wiring'
  description?: string;
  systemComponentId?: string; // Link to SystemComponent if applicable
}

export interface FailureMode extends Identifiable {
  hardwareComponentId: string;
  failureType: FailureType;
  description: string;
  probabilityAssessment?: number; // 0-1 probability if known
  severityLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  detectionDifficulty?: 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult';
}

export interface UnsafeInteraction extends Identifiable {
  sourceComponentId: string; // Hardware component that fails
  affectedComponentIds: string[]; // Components affected by the failure
  interactionType: 'Cascading' | 'Blocking' | 'Common Cause' | 'Environmental' | 'Other';
  description: string;
  hazardIds: string[]; // Links to hazards this interaction could cause
}

export interface HardwareAnalysisSession extends Identifiable {
  completedAt?: string;
  analysisNotes?: string;
  importedProbabilityData?: boolean;
}

export interface CompletenessReport {
  overallCompleteness: number;
  stepCompleteness: Record<string, number>;
  issues: any[];
  // Additional properties from completenessChecker.ts implementation
  overallScore?: number;
  checks?: any[];
  criticalIssues?: number;
  warnings?: number;
  suggestions?: any[];
  timestamp?: Date;
}

export interface AnalysisData {
  analysisSession: AnalysisSession | null;
  castStep2SubStep: number;
  castStep2MaxReachedSubStep: number;
  losses: Loss[];
  hazards: Hazard[];
  systemConstraints: SystemConstraint[];
  systemComponents: SystemComponent[];
  controllers: Controller[];
  controlPaths: ControlPath[];
  feedbackPaths: FeedbackPath[];
  communicationPaths: CommunicationPath[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  requirements: Requirement[];
  sequenceOfEvents: EventDetail[];
  activeContexts: { [key: string]: string };
  hardwareComponents: HardwareComponent[];
  failureModes: FailureMode[];
  unsafeInteractions: UnsafeInteraction[];
  hardwareAnalysisSession: HardwareAnalysisSession | null;
  scenarios?: CausalScenario[]; // Causal scenarios for Step 5
}

// Report Generation Types
export interface ReportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown';
  includeExecutiveSummary: boolean;
  includeSystemOverview: boolean;
  includeLosses: boolean;
  includeHazards: boolean;
  includeConstraints: boolean;
  includeControlStructure: boolean;
  includeUCAs: boolean;
  includeCausalScenarios: boolean;
  includeRequirements: boolean;
  includeMetadata: boolean;
  includeDetailedAnalysis?: boolean; // Include detailed technical analysis
  customSections?: ReportCustomSection[]; // User-defined report sections
  customTitle?: string;
  customSubtitle?: string;
  customAuthor?: string;
  customOrganization?: string;
  customDate?: string;
  customNotes?: string;
}

export interface ReportCustomSection {
  id: string;
  title: string;
  content: string;
  order: number;
  includeInTOC?: boolean;
}

export interface GeneratedReport {
  id: string;
  format: string;
  generatedAt: Date;
  fileName: string;
  content: string | Blob;
  options: ReportOptions;
  metadata?: ReportMetadata; // Additional report metadata
}

export interface ReportMetadata {
  analysisType: AnalysisType;
  totalPages?: number;
  wordCount?: number;
  sectionCount?: number;
  analysisCompleteness: number;
  includedSections: string[];
  generationTime: number; // in milliseconds
  version: string;
}

export enum FailureInfluenceType {
  PhysicalDamage = 'Physical Impact / Damage',
  ElectricalSurge = 'Electrical Surge / Interference',
  ThermalStress = 'Thermal Stress',
  DataCorruption = 'Data Corruption',
  ResourceDepletion = 'Resource Depletion / Contention',
  ChemicalContamination = 'Chemical Contamination',
}

export interface FailurePath extends Identifiable {
  sourceComponentId: string;
  targetComponentId: string;
  influenceType: FailureInfluenceType;
  description: string;
}
