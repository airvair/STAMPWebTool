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

// Add this new interface for peer-to-peer communication links
export interface CommunicationPath {
  id: string;
  sourceControllerId: string;
  targetControllerId: string;
  description: string;
}

// Add the 'parentNode' property to your existing Controller interface
export interface Controller {
  id: string;
  name: string;
  ctrlType: ControllerType;
  parentNode?: string; // ID of the parent controller (if any)
  // ... other existing properties
}

export enum UCAType {
  NotProvided = 'Not Provided',
  ProvidedUnsafe = 'Provided Unsafe/Incorrectly/Excess',
  TooEarly = 'Too Early (unsafe timing/order)',
  TooLate = 'Too Late (unsafe timing/order)',
  WrongOrder = 'Wrong Order (relative to other actions)',
  TooLong = 'Applied Too Long / Stopped Too Late (wrong duration)',
  TooShort = 'Applied Too Short / Stopped Too Soon (wrong duration)',
}

export enum ScenarioClass {
  Class1 = '1',
  Class2 = '2',
  Class3 = '3',
  Class4 = '4',
}

export interface Identifiable {
  id: string;
}

export interface AnalysisSession extends Identifiable {
  analysisType: AnalysisType | null;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentStep: string;
  scope?: string;
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
  parentHazardId?: string;
  subHazardDetails?: string;
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

export interface Controller extends Identifiable {
  name: string;
  ctrlType: ControllerType;
  description?: string;
  responsibilities?: string;
  teamDetails?: string;
  orgDetails?: string;
  fiveFactorArchetype?: FiveFactorArchetype;
  customFiveFactorScores?: FiveFactorScores;
  x?: number;
  y?: number;
  parentId?: string; // Property to link to a parent controller
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
  verb: string;
  object: string;
  description: string;
  isOutOfScope: boolean;
}

export interface UnsafeControlAction extends Identifiable {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  context: string;
  hazardIds: string[];
  code: string;
}

export interface UCCA extends Identifiable {
  code: string;
  description: string;
  context: string;
  hazardIds: string[];
}

export interface CausalScenario extends Identifiable {
  ucaId: string;
  classType: ScenarioClass;
  description: string;
  isAdditional?: boolean;
}

export interface Requirement extends Identifiable {
  text: string;
  linkedScenarioIds: string[];
  type: 'Requirement' | 'Mitigation';
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
  relevantScenarioClasses?: ScenarioClass[];
}