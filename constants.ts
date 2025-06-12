
import { ControllerType, UCAType, ScenarioClass, StepDefinition, FiveFactorArchetype, FiveFactorScores } from './types';

export const APP_TITLE = "STAMP Tool"; // Updated title

export const CONTROLLER_TYPE_COLORS: Record<ControllerType, string> = {
  [ControllerType.Software]: 'bg-teal-100 text-teal-800 border-teal-300',       // #E0F2F1
  [ControllerType.Human]: 'bg-yellow-100 text-yellow-800 border-yellow-300',     // #FFF9C4
  [ControllerType.Team]: 'bg-amber-100 text-amber-800 border-amber-300',        // #FFECB3
  [ControllerType.Organisation]: 'bg-purple-100 text-purple-800 border-purple-300', // #E1BEE7
};

export const MISSING_FEEDBACK_COLOR = 'border-red-500 text-red-700'; // Dashed property handled by border-style

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
]; // Updated to match OCR pg 2

// FR-5.1 / OCR pg 25: UCA questions map. Current one is fine.
export const UCA_QUESTIONS_MAP: { type: UCAType; question: string }[] = [
  { type: UCAType.NotProvided, question: 'Is a hazard caused if the control action is NOT PROVIDED when needed?' },
  { type: UCAType.ProvidedUnsafe, question: 'Is a hazard caused if the control action is PROVIDED IN AN UNSAFE MANNER (e.g., incorrect, too much, not enough)?' },
  { type: UCAType.TooEarly, question: 'Is a hazard caused if the control action is provided TOO EARLY (unsafe timing/order)?' },
  { type: UCAType.TooLate, question: 'Is a hazard caused if the control action is provided TOO LATE (unsafe timing/order)?' },
  { type: UCAType.WrongOrder, question: 'Is a hazard caused if the control action is provided in the WRONG ORDER relative to other actions?' },
  { type: UCAType.TooLong, question: 'Is a hazard caused if a continuous control action is APPLIED TOO LONG (stopped too late)?' },
  { type: UCAType.TooShort, question: 'Is a hazard caused if a continuous control action is APPLIED TOO SHORT (stopped too soon)?' },
];

// From OCR pg 3-4, 6-7 for Hazard creation guidance
export const SYSTEM_COMPONENT_EXAMPLES: string[] = [
  "Aircraft", "Ship", "Spacecraft", "Satellite", "Powerplant", "Vehicle", "Patient", "Software system", "Door", "Brakes", "Engine", "Landing Gear"
];

export const SYSTEM_STATE_CONDITION_EXAMPLES: { category: string, examples: string[] }[] = [
  {
    category: "Inflight Conditions / States",
    examples: [
      "inability to control pitch attitude",
      "inability to control roll the aircraft",
      "violating minimum separation standards inflight",
      "moving too close to the ground while inflight",
      "moving too close to a severe storm inflight",
      "flying in icing conditions",
      "thrust not sufficient to prevent descent during flight",
      "angle of attack not sufficient to prevent descent during flight"
    ]
  },
  {
    category: "On Ground Conditions / States",
    examples: [
      "inability on the runway (until aircraft lands)",
      "moving at too high speed on ground",
      "moving at too low speed on ground",
    ]
  },
  {
    category: "General Vehicle/System States",
    examples: [
      "moving at too high speed (general)",
      "moving at too low speed (general)",
      "releasing dangerous materials",
      "security is breached",
      "unable to complete mission",
      "exit doors not available when needed",
      "regulations not followed when required"
    ]
  }
];


// Based on OCR pg 29, 31 for Causal Scenarios
export const SCENARIO_CLASSES_BY_CONTROLLER: Record<ControllerType, { classType: ScenarioClass, label: string, description: string }[]> = {
  [ControllerType.Software]: [
    { classType: ScenarioClass.Class1, label: 'Incorrect Algorithm/Logic or Data leads to UCA', description: 'Software provides UCA due to flaws in its design, implementation, or the data it uses for its process model.' },
    { classType: ScenarioClass.Class2, label: 'Algorithm/Logic Correct, but UCA still provided to "correct" perceived issue', description: 'Software correctly implements its logic, but this logic is based on a flawed understanding of safety or leads to a UCA in specific unhandled contexts (Process Model flawed w.r.t safety goal).' },
    { classType: ScenarioClass.Class3, label: 'Safe CA by Software made Unsafe by Process', description: 'Software issues a safe command, but issues in the controlled process (hardware, network, other software) lead to a hazardous state.' },
    { classType: ScenarioClass.Class4, label: 'Safe CA by Software Contributes to Hazard in Complex System', description: 'Software issues a safe command, correctly executed, but interaction with other system components or evolving system state leads to hazard.' },
  ],
  [ControllerType.Human]: [
    { classType: ScenarioClass.Class1, label: 'Flawed Mental Model or Incorrect/Missing Information leads to UCA', description: 'Operator provides UCA due to misunderstanding system state, dynamics, or lacking necessary data for safe decision-making.' },
    { classType: ScenarioClass.Class2, label: 'Correct Mental Model for action, but action itself is UCA due to flawed procedure/training', description: 'Operator follows procedure/training, but that guidance is flawed or inappropriate for the context, resulting in UCA.' },
    { classType: ScenarioClass.Class3, label: 'Safe Action by Human made Unsafe by Process/Tools', description: 'Operator attempts a safe action, but tools, equipment, or environment cause it to be executed unsafely or have unsafe consequences.' },
    { classType: ScenarioClass.Class4, label: 'Safe Action by Human Contributes to Hazard in Complex System/Team', description: 'Operator performs a locally safe action, but in combination with team actions or system dynamics, it contributes to a hazard.' },
  ],
  [ControllerType.Team]: [
    { classType: ScenarioClass.Class1, label: 'Flawed Shared Process Model leads to UCA by team', description: 'Team members have inconsistent or incorrect understanding of roles, responsibilities, or system state, leading to a coordinated UCA.' },
    { classType: ScenarioClass.Class2, label: 'Inadequate Communication/Coordination results in UCA', description: 'Breakdowns in information flow or synchronized actions among team members lead to the team (or a member on behalf of) issuing a UCA.' },
    { classType: ScenarioClass.Class3, label: 'Safe Team Action made Unsafe by External Factors/Process', description: 'Team coordinates and issues a safe action, but external factors or the process execution lead to a hazardous state.' },
    { classType: ScenarioClass.Class4, label: 'Safe Team Action Contributes to Broader System Hazard', description: 'Team performs a coordinated safe action, but it contributes to a larger system-level hazard due to interactions outside the team\'s immediate control or view.' },
  ],
  [ControllerType.Organisation]: [
    { classType: ScenarioClass.Class1, label: 'Flawed Organizational Policies/Procedures lead to UCA', description: 'Deficiencies in safety culture, training, resource allocation, or management oversight directly result in or sanction unsafe actions.' },
    { classType: ScenarioClass.Class2, label: 'Dysfunctional Organizational Dynamics cause UCA', description: 'Internal conflicts, production pressure, or misaligned incentives lead to decisions or actions that are unsafe.' },
    { classType: ScenarioClass.Class3, label: 'Safe Organizational Directive made Unsafe by Implementation', description: 'Organization issues a safe policy/directive, but its implementation at lower levels or by other entities leads to unsafe outcomes.' },
    { classType: ScenarioClass.Class4, label: 'Safe Organizational Stance Contributes to System Hazard in Wider Context', description: 'Organization maintains a safe policy, but this interacts with external regulations, industry practices, or societal factors to create hazards.' },
  ],
};

export const STEPS_BASE: StepDefinition[] = [
  // Step 1 is StartupModal, Step 2 is specific
  { path: 'step3', title: 'Control Structure', shortTitle: 'Structure' }, // OCR Step 3
  { path: 'step4', title: 'Control Actions', shortTitle: 'Actions' }, // OCR Step 4
  { path: 'step5', title: 'Unsafe Control Actions (UCAs & UCCAs)', shortTitle: 'UCAs/UCCAs' }, // OCR Step 5
  { path: 'step6', title: 'Causal Scenarios', shortTitle: 'Scenarios' }, // OCR Step 6
  { path: 'step7', title: 'Requirements / Mitigations', shortTitle: 'Reqs/Mitigs' }, // OCR Step 7
  { path: 'step8', title: 'Report & Export', shortTitle: 'Report' },
];

export const CAST_STEPS: StepDefinition[] = [
  { path: '/cast/step2', title: 'CAST: Scope, Events, Losses, Hazards & Constraints', shortTitle: 'Scope & Losses (CAST)' }, // OCR Step 2 CAST
  ...STEPS_BASE.map(s => ({ ...s, path: `/analysis/${s.path}`}))
];

export const STPA_STEPS: StepDefinition[] = [
  { path: '/stpa/step2', title: 'STPA: Scope, Losses, Hazards & Constraints', shortTitle: 'Scope & Losses (STPA)' }, // OCR Step 2 STPA
  ...STEPS_BASE.map(s => ({ ...s, path: `/analysis/${s.path}`}))
];

// OCR pg 34
export const FIVE_FACTOR_ARCHETYPES: Record<FiveFactorArchetype, FiveFactorScores & { label: string }> = {
  GeneralPopulation: {
    label: "General Population (Average)",
    neuroticism: 2.5, extraversion: 2.5, openness: 2.5, agreeableness: 2.5, conscientiousness: 2.5
  },
  CommercialPilot: {
    label: "Commercial Pilot (Typical Profile from OCR)",
    neuroticism: 1.5, extraversion: -2.0, openness: 2.0, agreeableness: 2.5, conscientiousness: 3.5
    // Note: OCR Extraversion for Commercial Pilot is -2.0, which is unusual for a 0-5 scale. Assuming it means 2.0 or typo and using 2.0. If scale can be negative, then -2.0.
    // The OCR states "0 through +5 with 2.5 = average". -2.0 is outside this. I will interpret it as 2.0 or 0.5 if it means "low".
    // For now, I'll use values that fit the 0-5 scale interpretation.
    // Corrected based on OCR image: Extraversion -2.0. This seems to imply a deviation from average rather than absolute score on 0-5.
    // The provided scale is 0 to +5 with 2.5 average.  I will adjust extraversion to be on this scale or note it.
    // Given the context of "tool enters all 2.5 for behind the scenes weighting", and then provides specific values,
    // these specific values likely *are* the scores. The -2.0 for Extraversion is problematic with a 0-5 scale.
    // I will cap it at 0 for now or assume it's a relative score from 2.5.
    // Re-evaluating: The prompt might imply these are *modifiers* or pre-set values directly.
    // I'll use them as given, assuming the tool internally knows how to interpret them (even if -2.0 seems off for 0-5 scale).
    // Let's assume the values are as written and the downstream logic handles their meaning.
  },
  MilitaryPilot: {
    label: "Military Pilot (Typical Profile from OCR)",
    neuroticism: 0.7, extraversion: 4.7, openness: 2.75, agreeableness: 1.1, conscientiousness: 3.5
  },
  Custom: {
    label: "Custom Input", // User will fill these
    neuroticism: 2.5, extraversion: 2.5, openness: 2.5, agreeableness: 2.5, conscientiousness: 2.5
  }
};

export const PERSONALITY_TRAIT_DESCRIPTIONS: Record<keyof FiveFactorScores, { high: string, low: string, average?:string }> = {
  neuroticism: {
    high: "Hyper-alert, concerned, potential distraction, overestimates threats. Less systematic scanning.", // OCR pg 37
    low: "Likely calmer, less prone to worry-driven decisions.", // Inferred
    average: "Average emotional stability." // OCR pg 37 "Lower than average: no effect" implies average is baseline
  },
  extraversion: {
    high: "More reliant on socially reinforced cues, potentially less methodological evaluation.", // OCR pg 37
    low: "More reserved, potentially more independent in evaluation." // Inferred
  },
  openness: {
    high: "Broader information gathering, curious, considers alternatives, systematic analysis. More likely to change direction.", // OCR pg 37, 39
    low: "May miss novel cues, overlook new patterns, anchor on familiar. Closed to alternatives." // OCR pg 37, 39
  },
  agreeableness: {
    high: "Tends to follow group flow, conflict-avoidant, biases towards social cues or group consensus.", // OCR pg 37, 39
    low: "More independent, may challenge consensus, less swayed by group pressure." // OCR pg 39 "may bias against group consensus"
  },
  conscientiousness: {
    high: "Thorough, organized, habit-driven attention, diligent systematic monitoring and analysis. Adherence to procedures.", // OCR pg 38, 39, 40
    low: "May neglect details, attentional bias, less reliable in decisions/adherence to procedures." // OCR pg 38, 39, 40
  }
};
