import React from 'react';
import { ControllerType, UCAType, StepDefinition, FiveFactorArchetype, FiveFactorScores } from './types';

export const APP_TITLE = "STAMP Tool";
export const APP_VERSION = "Alpha";

export const CONTROLLER_TYPE_COLORS: Record<ControllerType, string> = {
  [ControllerType.Software]: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/50 dark:text-teal-200 dark:border-teal-500/30',
  [ControllerType.Human]: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-500/30',
  [ControllerType.Team]: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-500/30',
  [ControllerType.Organisation]: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-500/30',
};

// NEW: Style object for ReactFlow nodes to match the dark theme list items
export const CONTROLLER_NODE_STYLE: Record<ControllerType, React.CSSProperties> = {
  [ControllerType.Software]: {
    backgroundColor: 'rgba(13, 74, 80, 0.5)', // bg-teal-900/50
    color: '#a7f3d0', // text-teal-200
    borderColor: 'rgba(45, 212, 191, 0.3)', // border-teal-500/30
    borderWidth: 1,
    borderStyle: 'solid',
    backdropFilter: 'blur(4px)',
  },
  [ControllerType.Human]: {
    backgroundColor: 'rgba(113, 113, 14, 0.5)', // bg-yellow-900/50
    color: '#fef08a', // text-yellow-200
    borderColor: 'rgba(234, 179, 8, 0.3)', // border-yellow-500/30
    borderWidth: 1,
    borderStyle: 'solid',
    backdropFilter: 'blur(4px)',
  },
  [ControllerType.Team]: {
    backgroundColor: 'rgba(120, 53, 15, 0.5)', // bg-amber-900/50
    color: '#fde68a', // text-amber-200
    borderColor: 'rgba(245, 158, 11, 0.3)', // border-amber-500/30
    borderWidth: 1,
    borderStyle: 'solid',
    backdropFilter: 'blur(4px)',
  },
  [ControllerType.Organisation]: {
    backgroundColor: 'rgba(88, 28, 135, 0.5)', // bg-purple-900/50
    color: '#e9d5ff', // text-purple-200
    borderColor: 'rgba(168, 85, 247, 0.3)', // border-purple-500/30
    borderWidth: 1,
    borderStyle: 'solid',
    backdropFilter: 'blur(4px)',
  },
};

// Constants for Graph Visualization
export const NODE_WIDTH = 180;
export const BASE_NODE_HEIGHT = 60;
export const PARENT_PADDING = 40;
export const CHILD_NODE_SPACING = 20; // Padding between child nodes
export const ACTUATOR_SENSOR_BOX_SIZE = 16;

// NEW: Constants for Team Visualization
export const TEAM_NODE_HEADER_HEIGHT = 40;
export const TEAM_NODE_PADDING = 15;
export const MEMBER_NODE_WIDTH = NODE_WIDTH;
export const MEMBER_NODE_HEIGHT = 50;
export const MEMBER_NODE_SPACING = 10;
export const COMMANDER_BORDER_COLOR = '#DAA520'; // GoldenRod for commanders

export const MISSING_FEEDBACK_COLOR = 'border-red-500 text-red-700';

export const CONTROL_LINE_COLOR = '#2563eb';
export const FEEDBACK_LINE_COLOR = '#16a34a';
export const MISSING_LINE_COLOR = 'red';

export const STANDARD_LOSSES: { id: string; title: string; description: string }[] = [
  { id: 'L-Std-Life', title: 'Loss of life', description: 'Fatalities or severe harm to individuals.' },
  { id: 'L-Std-Property', title: 'Loss of property', description: 'Aircraft damage, other physical damage or loss.' },
  { id: 'L-Std-Revenue', title: 'Loss of revenue', description: 'Financial impact or reduced market share from dissatisfied customers.' },
  { id: 'L-Std-Security', title: 'Loss of security (software or physical)', description: 'Financial or reputational impact from a security breach.' },
  { id: 'L-Std-Mission', title: 'Loss of mission', description: 'Inability to complete the primary objectives of the system.' },
  { id: 'L-Std-Compliance', title: 'Loss of regulatory compliance', description: 'Legal action or fines resulting from noncompliance.' },
  { id: 'L-Std-Reputation', title: 'Loss of brand or reputation', description: 'Damage to public image or trust.' },
  { id: 'L-Std-CustomerSat', title: 'Loss of customer satisfaction', description: 'Negative impact on customer experience.' },
  { id: 'L-Std-Environment', title: 'Loss of environmental integrity', description: 'Spill or contamination harming the environment.' },
];

export const UCA_QUESTIONS_MAP: { type: UCAType; question: string }[] = [
  { type: UCAType.NotProvided, question: 'Is a hazard caused if the control action is NOT PROVIDED when needed?' },
  { type: UCAType.ProvidedUnsafe, question: 'Is a hazard caused if the control action is PROVIDED IN AN UNSAFE MANNER (e.g., incorrect, too much, not enough)?' },
  { type: UCAType.TooEarly, question: 'Is a hazard caused if the control action is provided TOO EARLY (unsafe timing/order)?' },
  { type: UCAType.TooLate, question: 'Is a hazard caused if the control action is provided TOO LATE (unsafe timing/order)?' },
  { type: UCAType.WrongOrder, question: 'Is a hazard caused if the control action is provided in the WRONG ORDER relative to other actions?' },
  { type: UCAType.TooLong, question: 'Is a hazard caused if a continuous control action is APPLIED TOO LONG (stopped too late)?' },
  { type: UCAType.TooShort, question: 'Is a hazard caused if a continuous control action is APPLIED TOO SHORT (stopped too soon)?' },
];

export const SYSTEM_COMPONENT_EXAMPLES: string[] = [
  "Aircraft", "Ship", "Spacecraft", "Satellite", "Powerplant", "Vehicle", "Patient", "Software system"
];

export const SYSTEM_STATE_CONDITION_EXAMPLES: { category: string, examples: string[] }[] = [
  {
    category: "Inflight Conditions / States",
    examples: [
      "Inflight",
    ]
  },
  {
    category: "On Ground Conditions / States",
    examples: [
      "On the ground",
    ]
  },
  {
    category: "Speed Conditions",
    examples: [
      "Too high a speed",
      "Too low speed",
    ]
  },
  {
    category: "Proximity Conditions",
    examples: [
      "Too close to",
    ]
  },
  {
    category: "Material/Security States",
    examples: [
      "Releases dangerous materials",
      "Security is breached",
    ]
  },
  {
    category: "Mission/Operational States",
    examples: [
      "Unable to complete mission",
      "Exit doors not available",
      "Regulations not followed when",
    ]
  }
];



export const STEPS_BASE: StepDefinition[] = [
  { path: 'step3', title: 'Control Structure & Actions', shortTitle: 'Structure & Actions' },
  { path: 'step4', title: 'Unsafe Control Actions (UCAs & UCCAs)', shortTitle: 'UCAs/UCCAs' },
  { path: 'step5', title: 'Causal Scenarios', shortTitle: 'Scenarios' },
  { path: 'step6', title: 'Requirements / Mitigations', shortTitle: 'Reqs/Mitigs' },
];

export const CAST_STEPS: StepDefinition[] = [
  { path: '/cast/step2', title: 'Scope, Events, Losses, Hazards & Constraints', shortTitle: 'Scope & Losses' },
  ...STEPS_BASE.map(s => ({ ...s, path: `/analysis/${s.path}`}))
];

export const STPA_STEPS: StepDefinition[] = [
  { path: '/stpa/step2', title: 'Scope, Losses, Hazards & Constraints', shortTitle: 'Scope & Losses' },
  ...STEPS_BASE.map(s => ({ ...s, path: `/analysis/${s.path}`}))
];

export const FIVE_FACTOR_ARCHETYPES: Record<FiveFactorArchetype, FiveFactorScores & { label: string }> = {
  GeneralPopulation: {
    label: "General Population (Average)",
    neuroticism: 2.5, extraversion: 2.5, openness: 2.5, agreeableness: 2.5, conscientiousness: 2.5
  },
  CommercialPilot: {
    label: "Commercial Pilot (Typical Profile from OCR)",
    neuroticism: 1.5, extraversion: -2.0, openness: 2.0, agreeableness: 2.5, conscientiousness: 3.5
  },
  MilitaryPilot: {
    label: "Military Pilot (Typical Profile from OCR)",
    neuroticism: 0.7, extraversion: 4.7, openness: 2.75, agreeableness: 1.1, conscientiousness: 3.5
  },
  Custom: {
    label: "Custom Input",
    neuroticism: 2.5, extraversion: 2.5, openness: 2.5, agreeableness: 2.5, conscientiousness: 2.5
  }
};

export const PERSONALITY_TRAIT_DESCRIPTIONS: Record<keyof FiveFactorScores, { high: string, low: string, average?:string }> = {
  neuroticism: {
    high: "Hyper-alert, concerned, potential distraction, overestimates threats. Less systematic scanning.",
    low: "Likely calmer, less prone to worry-driven decisions.",
    average: "Average emotional stability."
  },
  extraversion: {
    high: "More reliant on socially reinforced cues, potentially less methodological evaluation.",
    low: "More reserved, potentially more independent in evaluation."
  },
  openness: {
    high: "Broader information gathering, curious, considers alternatives, systematic analysis. More likely to change direction.",
    low: "May miss novel cues, overlook new patterns, anchor on familiar. Closed to alternatives."
  },
  agreeableness: {
    high: "Tends to follow group flow, conflict-avoidant, biases towards social cues or group consensus.",
    low: "More independent, may challenge consensus, less swayed by group pressure."
  },
  conscientiousness: {
    high: "Thorough, organized, habit-driven attention, diligent systematic monitoring and analysis. Adherence to procedures.",
    low: "May neglect details, attentional bias, less reliable in decisions/adherence to procedures."
  }
};

export const GLOSSARY: Record<string, string> = {
  'Accident': 'An undesired, unacceptable, and unplanned event that results in a loss. ',
  'Hazard': 'A system state or set of conditions that, together with specific environmental conditions, can lead to an accident or loss. ',
  'System': 'A set of interdependent parts sharing a common purpose. The performance of the whole is affected by each and every one of its parts. ',
  'Safety Control Structure': 'The set of controls and controllers that enforce safety constraints on the system. It includes technical and social components, from physical interlocks to management policies and regulatory oversight. ',
  'Controller': 'A component (human, software, organization, or team) that issues control actions to manage a process or another component. ',
  'Control Action': 'An action taken by a controller to influence the state of a controlled process. ',
  'Controlled Process': 'The physical system or process whose behavior is being managed by a controller. ',
  'Feedback': 'Information about the state of the controlled process that is provided back to the controller. It is used to determine what control actions are necessary. ',
  'Unsafe Control Action (UCA)': 'A control action that, within a particular context and worst-case environment, will lead to a hazard. ',
  'Process Model': 'The model a controller (especially automated) uses to understand the state of the controlled process and make decisions. Accidents often result when this model is inconsistent with the actual state of the process. ',
  'Mental Model': 'A human controller\'s internal understanding of how a system works and its current state. It is the human equivalent of a process model. ',
};