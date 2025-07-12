/**
 * Industry-Specific Templates for STPA Analysis
 * Pre-configured templates for various domains
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
  ControllerType,
  UCAType,
  UCCAType,
  ScenarioClass
} from '../types';

export interface IndustryTemplate {
  id: string;
  name: string;
  industry: Industry;
  description: string;
  icon: string;
  tags: string[];
  applicableSystems: string[];
  regulations: string[];
  bestPractices: string[];
  template: {
    losses: Partial<Loss>[];
    hazards: Array<Partial<Hazard> & { linkedLossIds?: string[] }>;
    controllers: Partial<Controller>[];
    controlActions: Partial<ControlAction>[];
    commonUCAs: Partial<UnsafeControlAction>[];
    commonUCCAs: Partial<UCCA>[];
    typicalScenarios: Partial<CausalScenario>[];
    standardRequirements: Partial<Requirement>[];
  };
  customFields?: Record<string, any>;
  riskMatrix?: RiskMatrixConfig;
}

export enum Industry {
  AEROSPACE = 'aerospace',
  AUTOMOTIVE = 'automotive',
  MEDICAL_DEVICES = 'medical_devices',
  NUCLEAR = 'nuclear',
  RAIL = 'rail',
  MARITIME = 'maritime',
  CHEMICAL = 'chemical',
  ENERGY = 'energy',
  MANUFACTURING = 'manufacturing',
  ROBOTICS = 'robotics',
  SOFTWARE = 'software',
  INFRASTRUCTURE = 'infrastructure'
}

export interface RiskMatrixConfig {
  likelihood: RiskLevel[];
  severity: RiskLevel[];
  acceptabilityThresholds: {
    acceptable: number;
    tolerable: number;
    unacceptable: number;
  };
}

export interface RiskLevel {
  level: number;
  label: string;
  description: string;
  value: number;
}

export interface TemplateCustomization {
  includeRegulations: boolean;
  includeIndustryHazards: boolean;
  includeBestPractices: boolean;
  customizationLevel: 'minimal' | 'standard' | 'comprehensive';
}

/**
 * Industry Templates Manager
 */
export class IndustryTemplatesManager {
  private templates = new Map<string, IndustryTemplate>();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Get all available templates
   */
  getTemplates(): IndustryTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by industry
   */
  getTemplatesByIndustry(industry: Industry): IndustryTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.industry === industry);
  }

  /**
   * Get a specific template
   */
  getTemplate(id: string): IndustryTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Apply template to create initial analysis structure
   */
  applyTemplate(
    templateId: string,
    customization: TemplateCustomization
  ): {
    losses: Loss[];
    hazards: Hazard[];
    controllers: Controller[];
    controlActions: ControlAction[];
    ucas: UnsafeControlAction[];
    uccas: UCCA[];
    scenarios: CausalScenario[];
    requirements: Requirement[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const result = {
      losses: this.instantiateLosses(template, customization),
      hazards: this.instantiateHazards(template, customization),
      controllers: this.instantiateControllers(template, customization),
      controlActions: this.instantiateControlActions(template, customization),
      ucas: customization.customizationLevel !== 'minimal' 
        ? this.instantiateUCAs(template, customization) : [],
      uccas: customization.customizationLevel === 'comprehensive'
        ? this.instantiateUCCAs(template, customization) : [],
      scenarios: customization.customizationLevel === 'comprehensive'
        ? this.instantiateScenarios(template, customization) : [],
      requirements: customization.includeBestPractices
        ? this.instantiateRequirements(template, customization) : []
    };

    // Link entities based on template relationships
    this.linkEntities(result);

    return result;
  }

  /**
   * Search templates by criteria
   */
  searchTemplates(criteria: {
    industry?: Industry;
    tags?: string[];
    regulations?: string[];
    searchText?: string;
  }): IndustryTemplate[] {
    let results = Array.from(this.templates.values());

    if (criteria.industry) {
      results = results.filter(t => t.industry === criteria.industry);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(t => 
        criteria.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (criteria.regulations && criteria.regulations.length > 0) {
      results = results.filter(t =>
        criteria.regulations!.some(reg => t.regulations.includes(reg))
      );
    }

    if (criteria.searchText) {
      const search = criteria.searchText.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return results;
  }

  /**
   * Get regulatory compliance checklist for a template
   */
  getComplianceChecklist(templateId: string): {
    regulation: string;
    requirements: string[];
    references: string[];
  }[] {
    const template = this.templates.get(templateId);
    if (!template) return [];

    // Return compliance requirements based on template
    return template.regulations.map(reg => ({
      regulation: reg,
      requirements: this.getRegulationRequirements(reg),
      references: this.getRegulationReferences(reg)
    }));
  }

  /**
   * Private initialization methods
   */
  private initializeTemplates(): void {
    // Aerospace Template
    this.templates.set('aerospace-aircraft', {
      id: 'aerospace-aircraft',
      name: 'Commercial Aircraft Systems',
      industry: Industry.AEROSPACE,
      description: 'Template for commercial aircraft flight control and avionics systems',
      icon: '✈️',
      tags: ['aviation', 'flight-control', 'avionics', 'safety-critical'],
      applicableSystems: ['Flight Control System', 'Autopilot', 'Navigation', 'Communication'],
      regulations: ['DO-178C', 'DO-254', 'ARP4761', 'FAA Part 25'],
      bestPractices: [
        'Redundant flight control systems',
        'Pilot override capability',
        'Fault detection and annunciation',
        'Crew alerting system design'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Loss of aircraft',
            description: 'Complete loss of aircraft and all souls on board'
          },
          {
            code: 'L-2',
            title: 'Loss of life or serious injury',
            description: 'Death or serious injury to passengers, crew, or people on ground'
          },
          {
            code: 'L-3',
            title: 'Loss of mission',
            description: 'Inability to complete planned flight or forced landing'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Aircraft enters uncontrolled flight',
            systemCondition: 'Aircraft attitude exceeds safe envelope',
            environmentalCondition: 'During any phase of flight'
          },
          {
            code: 'H-2',
            title: 'Controlled flight into terrain',
            systemCondition: 'Aircraft is on collision course with terrain',
            environmentalCondition: 'While under positive control'
          },
          {
            code: 'H-3',
            title: 'Loss of separation',
            systemCondition: 'Aircraft violates minimum separation standards',
            environmentalCondition: 'In controlled airspace'
          }
        ],
        controllers: [
          {
            name: 'Pilot Flying',
            ctrlType: ControllerType.Human,
            description: 'Primary pilot responsible for aircraft control'
          },
          {
            name: 'Autopilot System',
            ctrlType: ControllerType.Software,
            description: 'Automated flight control system'
          },
          {
            name: 'Flight Management System',
            ctrlType: ControllerType.Software,
            description: 'Navigation and performance management'
          },
          {
            name: 'Air Traffic Control',
            ctrlType: ControllerType.Human,
            description: 'Ground-based traffic management'
          }
        ],
        controlActions: [
          {
            verb: 'Command',
            object: 'control surface deflection',
            description: 'Direct aircraft control inputs'
          },
          {
            verb: 'Engage',
            object: 'autopilot mode',
            description: 'Activate automated flight control'
          },
          {
            verb: 'Set',
            object: 'flight path',
            description: 'Define intended route and altitude'
          }
        ],
        commonUCAs: [
          {
            ucaType: UCAType.NotProvided,
            context: 'when aircraft deviates from safe flight envelope',
            description: 'Pilot does not provide corrective control input'
          },
          {
            ucaType: UCAType.ProvidedUnsafe,
            context: 'when aircraft is in normal flight',
            description: 'Pilot provides excessive control input'
          }
        ],
        commonUCCAs: [
          {
            uccaType: UCCAType.Team,
            description: 'Pilot mental model does not match aircraft state',
            specificCause: 'Inadequate instrument scan or spatial disorientation'
          },
          {
            uccaType: UCCAType.Role,
            description: 'Attitude indicator provides incorrect information',
            specificCause: 'Sensor failure or calibration error'
          }
        ],
        typicalScenarios: [
          {
            title: 'Automation surprise during approach',
            description: 'Unexpected autopilot behavior during critical phase of flight'
          }
        ],
        standardRequirements: [
          {
            type: 'Requirement' as const,
            description: 'System shall provide clear mode annunciation to pilots',
            verificationMethod: 'Simulation and flight test'
          }
        ]
      },
      riskMatrix: {
        likelihood: [
          { level: 1, label: 'Extremely Improbable', description: '<10^-9 per flight hour', value: 0.000000001 },
          { level: 2, label: 'Extremely Remote', description: '10^-9 to 10^-7', value: 0.0000001 },
          { level: 3, label: 'Remote', description: '10^-7 to 10^-5', value: 0.00001 },
          { level: 4, label: 'Probable', description: '>10^-5', value: 0.01 }
        ],
        severity: [
          { level: 1, label: 'No Safety Effect', description: 'No effect on safety', value: 1 },
          { level: 2, label: 'Minor', description: 'Slight reduction in safety margins', value: 10 },
          { level: 3, label: 'Major', description: 'Significant reduction in safety margins', value: 100 },
          { level: 4, label: 'Hazardous', description: 'Large reduction in safety margins', value: 1000 },
          { level: 5, label: 'Catastrophic', description: 'Loss of life', value: 10000 }
        ],
        acceptabilityThresholds: {
          acceptable: 10,
          tolerable: 100,
          unacceptable: 1000
        }
      }
    });

    // Automotive Template
    this.templates.set('automotive-autonomous', {
      id: 'automotive-autonomous',
      name: 'Autonomous Vehicle Systems',
      industry: Industry.AUTOMOTIVE,
      description: 'Template for autonomous and semi-autonomous vehicle systems',
      icon: '🚗',
      tags: ['autonomous', 'ADAS', 'self-driving', 'automotive-safety'],
      applicableSystems: ['Autonomous Driving', 'ADAS', 'Emergency Braking', 'Lane Keeping'],
      regulations: ['ISO 26262', 'ISO 21448 (SOTIF)', 'UNECE regulations'],
      bestPractices: [
        'Fail-operational design for critical functions',
        'Driver monitoring and handover',
        'Sensor fusion and redundancy',
        'Scenario-based testing'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Loss of life or injury',
            description: 'Death or injury to vehicle occupants or other road users'
          },
          {
            code: 'L-2',
            title: 'Loss of vehicle',
            description: 'Damage to or loss of the vehicle'
          },
          {
            code: 'L-3',
            title: 'Loss of mobility',
            description: 'Vehicle unable to complete journey'
          },
          {
            code: 'L-4',
            title: 'Property damage',
            description: 'Damage to infrastructure or other property'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Vehicle collision',
            systemCondition: 'Vehicle is on collision course',
            environmentalCondition: 'With another vehicle, pedestrian, or object'
          },
          {
            code: 'H-2',
            title: 'Loss of vehicle control',
            systemCondition: 'Vehicle motion not controllable',
            environmentalCondition: 'During normal driving conditions'
          },
          {
            code: 'H-3',
            title: 'Unintended acceleration',
            systemCondition: 'Vehicle accelerates without driver intent',
            environmentalCondition: 'In any driving scenario'
          }
        ],
        controllers: [
          {
            name: 'Human Driver',
            ctrlType: ControllerType.Human,
            description: 'Human operator of the vehicle'
          },
          {
            name: 'Autonomous Driving System',
            ctrlType: ControllerType.Software,
            description: 'AI-based driving automation'
          },
          {
            name: 'Vehicle Dynamics Controller',
            ctrlType: ControllerType.Software,
            description: 'Low-level vehicle control (steering, braking, acceleration)'
          },
          {
            name: 'Sensor Fusion Module',
            ctrlType: ControllerType.Software,
            description: 'Combines data from multiple sensors'
          }
        ],
        controlActions: [
          {
            verb: 'Apply',
            object: 'braking force',
            description: 'Decelerate the vehicle'
          },
          {
            verb: 'Adjust',
            object: 'steering angle',
            description: 'Change vehicle direction'
          },
          {
            verb: 'Request',
            object: 'driver takeover',
            description: 'Hand control back to human driver'
          }
        ],
        commonUCAs: [
          {
            ucaType: UCAType.NotProvided,
            context: 'when obstacle detected in path',
            description: 'System does not apply brakes'
          },
          {
            ucaType: UCAType.TooLate,
            context: 'when approaching intersection',
            description: 'System applies brakes too late'
          }
        ],
        commonUCCAs: [
          {
            uccaType: UCCAType.Role,
            description: 'Camera provides degraded image',
            specificCause: 'Adverse weather conditions or sensor contamination'
          }
        ],
        typicalScenarios: [
          {
            title: 'Sensor degradation in bad weather',
            description: 'Progressive loss of sensor capability leading to unsafe behavior'
          }
        ],
        standardRequirements: [
          {
            type: 'Requirement' as const,
            description: 'System shall detect and respond to sensor degradation',
            verificationMethod: 'Environmental testing'
          }
        ]
      }
    });

    // Medical Device Template
    this.templates.set('medical-infusion-pump', {
      id: 'medical-infusion-pump',
      name: 'Medical Infusion Pump',
      industry: Industry.MEDICAL_DEVICES,
      description: 'Template for medical infusion pumps and drug delivery systems',
      icon: '💉',
      tags: ['medical', 'infusion', 'drug-delivery', 'patient-safety'],
      applicableSystems: ['Infusion Pump', 'PCA Pump', 'Insulin Pump', 'Syringe Driver'],
      regulations: ['IEC 60601', 'ISO 14971', 'FDA 510(k)', 'IEC 62304'],
      bestPractices: [
        'Drug library implementation',
        'Dose error reduction systems',
        'Clear alarm prioritization',
        'Intuitive user interface design'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Patient death',
            description: 'Loss of patient life due to device malfunction or misuse'
          },
          {
            code: 'L-2',
            title: 'Patient injury',
            description: 'Temporary or permanent harm to patient'
          },
          {
            code: 'L-3',
            title: 'Ineffective treatment',
            description: 'Failure to deliver therapeutic benefit'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Overdose delivery',
            systemCondition: 'Pump delivers medication above prescribed rate',
            environmentalCondition: 'During infusion therapy'
          },
          {
            code: 'H-2',
            title: 'Underdose delivery',
            systemCondition: 'Pump delivers medication below prescribed rate',
            environmentalCondition: 'When therapy is required'
          },
          {
            code: 'H-3',
            title: 'Air embolism',
            systemCondition: 'Air enters patient bloodstream',
            environmentalCondition: 'During IV infusion'
          }
        ],
        controllers: [
          {
            name: 'Clinical User',
            ctrlType: ControllerType.Human,
            description: 'Nurse or clinician operating the pump'
          },
          {
            name: 'Pump Controller',
            ctrlType: ControllerType.Software,
            description: 'Embedded software controlling pump operation'
          },
          {
            name: 'Drug Library System',
            ctrlType: ControllerType.Software,
            description: 'Database of drug parameters and limits'
          },
          {
            name: 'Hospital Pharmacy',
            ctrlType: ControllerType.Organisation,
            description: 'Provides drug information and protocols'
          }
        ],
        controlActions: [
          {
            verb: 'Program',
            object: 'infusion parameters',
            description: 'Set rate, volume, and drug information'
          },
          {
            verb: 'Start',
            object: 'infusion',
            description: 'Begin drug delivery'
          },
          {
            verb: 'Stop',
            object: 'infusion',
            description: 'Halt drug delivery'
          }
        ],
        commonUCAs: [
          {
            ucaType: UCAType.ProvidedUnsafe,
            context: 'when incorrect drug selected',
            description: 'User starts infusion with wrong medication'
          }
        ],
        commonUCCAs: [
          {
            uccaType: UCCAType.Team,
            description: 'User mental model incorrect',
            specificCause: 'Similar drug names or concentrations'
          }
        ],
        typicalScenarios: [
          {
            title: 'Programming error due to unit confusion',
            description: 'User enters dose in wrong units leading to calculation error'
          }
        ],
        standardRequirements: [
          {
            type: 'Requirement' as const,
            description: 'Interface shall clearly display units for all parameters',
            verificationMethod: 'Usability testing'
          }
        ]
      }
    });

    // Nuclear Template
    this.templates.set('nuclear-reactor-control', {
      id: 'nuclear-reactor-control',
      name: 'Nuclear Reactor Control System',
      industry: Industry.NUCLEAR,
      description: 'Template for nuclear reactor control and safety systems',
      icon: '☢️',
      tags: ['nuclear', 'reactor', 'safety-systems', 'critical-infrastructure'],
      applicableSystems: ['Reactor Protection', 'Control Rod Drive', 'Emergency Core Cooling'],
      regulations: ['10 CFR 50', 'IEC 61513', 'IEEE 603', 'IAEA Safety Standards'],
      bestPractices: [
        'Defense in depth',
        'Diversity and redundancy',
        'Fail-safe design',
        'Independent safety systems'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Radiological release',
            description: 'Release of radioactive material to environment'
          },
          {
            code: 'L-2',
            title: 'Core damage',
            description: 'Damage to reactor fuel assemblies'
          },
          {
            code: 'L-3',
            title: 'Loss of plant availability',
            description: 'Extended shutdown and economic loss'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Uncontrolled reactivity excursion',
            systemCondition: 'Reactor power increases beyond design limits',
            environmentalCondition: 'During power operation'
          },
          {
            code: 'H-2',
            title: 'Loss of core cooling',
            systemCondition: 'Insufficient heat removal from reactor core',
            environmentalCondition: 'Following reactor shutdown'
          }
        ],
        controllers: [
          {
            name: 'Reactor Operator',
            ctrlType: ControllerType.Human,
            description: 'Licensed operator in main control room'
          },
          {
            name: 'Reactor Protection System',
            ctrlType: ControllerType.Software,
            description: 'Automatic safety system'
          },
          {
            name: 'Plant Computer',
            ctrlType: ControllerType.Software,
            description: 'Monitoring and control system'
          }
        ],
        controlActions: [
          {
            verb: 'Insert',
            object: 'control rods',
            description: 'Reduce reactor power'
          },
          {
            verb: 'Initiate',
            object: 'reactor scram',
            description: 'Emergency reactor shutdown'
          }
        ],
        commonUCAs: [
          {
            ucaType: UCAType.NotProvided,
            context: 'when reactor power exceeds limits',
            description: 'Protection system fails to scram reactor'
          }
        ],
        commonUCCAs: [
          {
            uccaType: UCCAType.Organizational,
            description: 'Control rod drive mechanism fails',
            specificCause: 'Mechanical binding or electrical failure'
          }
        ],
        typicalScenarios: [
          {
            title: 'Common cause failure of safety systems',
            description: 'Multiple redundant systems fail due to shared vulnerability'
          }
        ],
        standardRequirements: [
          {
            type: 'Requirement' as const,
            description: 'Protection system shall be independent from control system',
            verificationMethod: 'Design review and testing'
          }
        ]
      }
    });

    // Add more industry templates...
    this.initializeAdditionalTemplates();
  }

  private initializeAdditionalTemplates(): void {
    // Rail Transport Template
    this.templates.set('rail-signaling', {
      id: 'rail-signaling',
      name: 'Railway Signaling System',
      industry: Industry.RAIL,
      description: 'Template for railway signaling and train control systems',
      icon: '🚂',
      tags: ['railway', 'signaling', 'CBTC', 'ETCS'],
      applicableSystems: ['Interlocking', 'Automatic Train Control', 'Level Crossings'],
      regulations: ['EN 50126/8/9', 'IEC 62425', 'CENELEC standards'],
      bestPractices: [
        'Fail-safe signaling principles',
        'Vital and non-vital separation',
        'Safe braking distance calculations'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Train collision',
            description: 'Collision between trains or with obstacles'
          },
          {
            code: 'L-2',
            title: 'Derailment',
            description: 'Train leaves the rails'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Trains on collision course',
            systemCondition: 'Two trains authorized in same section',
            environmentalCondition: 'On main line or junction'
          }
        ],
        controllers: [
          {
            name: 'Train Driver',
            ctrlType: ControllerType.Human,
            description: 'Person operating the train'
          },
          {
            name: 'Signaling System',
            ctrlType: ControllerType.Software,
            description: 'Trackside signaling equipment'
          }
        ],
        controlActions: [
          {
            verb: 'Display',
            object: 'signal aspect',
            description: 'Show stop/proceed indication'
          }
        ],
        commonUCAs: [],
        commonUCCAs: [],
        typicalScenarios: [],
        standardRequirements: []
      }
    });

    // Chemical Process Template
    this.templates.set('chemical-process', {
      id: 'chemical-process',
      name: 'Chemical Process Control',
      industry: Industry.CHEMICAL,
      description: 'Template for chemical process control and safety systems',
      icon: '⚗️',
      tags: ['chemical', 'process-safety', 'HAZOP', 'SIS'],
      applicableSystems: ['Reactor Control', 'Safety Instrumented Systems', 'Emergency Shutdown'],
      regulations: ['IEC 61511', 'OSHA PSM', 'EPA RMP', 'COMAH'],
      bestPractices: [
        'Inherently safer design',
        'Layers of protection',
        'Safety integrity levels',
        'Process hazard analysis'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Loss of containment',
            description: 'Release of hazardous materials'
          },
          {
            code: 'L-2',
            title: 'Fire or explosion',
            description: 'Uncontrolled combustion event'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Reactor runaway',
            systemCondition: 'Exothermic reaction out of control',
            environmentalCondition: 'During batch operation'
          }
        ],
        controllers: [
          {
            name: 'Process Operator',
            ctrlType: ControllerType.Human,
            description: 'Control room operator'
          },
          {
            name: 'Basic Process Control System',
            ctrlType: ControllerType.Software,
            description: 'DCS/PLC control system'
          }
        ],
        controlActions: [
          {
            verb: 'Open',
            object: 'relief valve',
            description: 'Relieve excess pressure'
          }
        ],
        commonUCAs: [],
        commonUCCAs: [],
        typicalScenarios: [],
        standardRequirements: []
      }
    });

    // Software Systems Template
    this.templates.set('software-cloud', {
      id: 'software-cloud',
      name: 'Cloud Software System',
      industry: Industry.SOFTWARE,
      description: 'Template for cloud-based software systems and services',
      icon: '☁️',
      tags: ['cloud', 'software', 'cybersecurity', 'SaaS'],
      applicableSystems: ['Web Services', 'Microservices', 'Data Processing', 'APIs'],
      regulations: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'],
      bestPractices: [
        'Zero trust architecture',
        'Encryption at rest and in transit',
        'Automated scaling and failover',
        'Comprehensive logging and monitoring'
      ],
      template: {
        losses: [
          {
            code: 'L-1',
            title: 'Data breach',
            description: 'Unauthorized access to sensitive data'
          },
          {
            code: 'L-2',
            title: 'Service unavailability',
            description: 'System downtime affecting users'
          },
          {
            code: 'L-3',
            title: 'Data loss',
            description: 'Permanent loss of user or system data'
          }
        ],
        hazards: [
          {
            code: 'H-1',
            title: 'Unauthorized data access',
            systemCondition: 'Authentication/authorization bypass possible',
            environmentalCondition: 'During normal operation'
          },
          {
            code: 'H-2',
            title: 'System overload',
            systemCondition: 'Resource consumption exceeds capacity',
            environmentalCondition: 'During peak usage or attack'
          }
        ],
        controllers: [
          {
            name: 'System Administrator',
            ctrlType: ControllerType.Human,
            description: 'Person managing system configuration'
          },
          {
            name: 'Load Balancer',
            ctrlType: ControllerType.Software,
            description: 'Distributes traffic across servers'
          },
          {
            name: 'Auto-scaling Service',
            ctrlType: ControllerType.Software,
            description: 'Dynamically adjusts resources'
          }
        ],
        controlActions: [
          {
            verb: 'Scale',
            object: 'compute resources',
            description: 'Add or remove servers'
          },
          {
            verb: 'Block',
            object: 'suspicious traffic',
            description: 'Prevent potential attacks'
          }
        ],
        commonUCAs: [],
        commonUCCAs: [],
        typicalScenarios: [],
        standardRequirements: []
      }
    });
  }

  /**
   * Private helper methods
   */
  private instantiateLosses(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): Loss[] {
    return template.template.losses.map((loss, index) => ({
      id: `loss_${Date.now()}_${index}`,
      code: loss.code || `L-${index + 1}`,
      title: loss.title || '',
      description: loss.description || '',
      ...loss
    }));
  }

  private instantiateHazards(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): Hazard[] {
    const hazards = template.template.hazards.map((hazard, index) => ({
      ...hazard,
      id: `hazard_${Date.now()}_${index}`,
      code: hazard.code || `H-${index + 1}`,
      title: hazard.title || '',
      systemComponent: '', // Required field
      systemState: '', // Required field
      systemCondition: hazard.systemCondition || '',
      environmentalCondition: hazard.environmentalCondition || '',
      linkedLossIds: [] // Will be linked later
    }));

    // Add industry-specific hazards if requested
    if (customization.includeIndustryHazards) {
      // Additional hazards based on industry
      // This would be expanded with more comprehensive lists
    }

    return hazards;
  }

  private instantiateControllers(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): Controller[] {
    return template.template.controllers.map((controller, index) => ({
      ...controller,
      id: `controller_${Date.now()}_${index}`,
      name: controller.name || '',
      ctrlType: controller.ctrlType || ControllerType.Software,
      description: controller.description
    }));
  }

  private instantiateControlActions(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): ControlAction[] {
    const actions: ControlAction[] = [];
    const controllers = this.instantiateControllers(template, customization);

    template.template.controlActions.forEach((action, index) => {
      // Create action for each applicable controller
      controllers.forEach((controller, ctrlIndex) => {
        if (controller.id) {
          actions.push({
            ...action,
            id: `action_${Date.now()}_${index}_${ctrlIndex}`,
            controllerId: controller.id,
            verb: action.verb || '',
            object: action.object || '',
            description: action.description || '',
            isOutOfScope: false
          });
        }
      });
    });

    return actions;
  }

  private instantiateUCAs(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): UnsafeControlAction[] {
    const ucas: UnsafeControlAction[] = [];
    
    template.template.commonUCAs.forEach((uca, index) => {
      ucas.push({
        ...uca,
        id: `uca_${Date.now()}_${index}`,
        code: uca.code || `UCA-${index + 1}`,
        controllerId: '', // Would need to be linked
        controlActionId: '', // Would need to be linked
        ucaType: uca.ucaType || UCAType.NotProvided,
        context: uca.context || '',
        description: uca.description || '',
        hazardIds: [], // Would need to be linked
        riskCategory: 'Medium' // Required field
      });
    });

    return ucas;
  }

  private instantiateUCCAs(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): UCCA[] {
    return template.template.commonUCCAs.map((ucca, index) => ({
      ...ucca,
      id: `ucca_${Date.now()}_${index}`,
      code: ucca.code || `UCCA-${index + 1}`,
      uccaType: ucca.uccaType || UCCAType.Team,
      description: ucca.description || '',
      context: ucca.context || '',
      involvedControllerIds: [], // Would need to be linked
      hazardIds: [], // Would need to be linked
      specificCause: ucca.specificCause || ''
    }));
  }

  private instantiateScenarios(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): CausalScenario[] {
    return template.template.typicalScenarios.map((scenario, index) => ({
      ...scenario,
      id: `scenario_${Date.now()}_${index}`,
      code: scenario.code || `CS-${index + 1}`,
      title: scenario.title || '',
      description: scenario.description || '',
      ucaId: '', // Required field
      ucaIds: [], // Would need to be linked
      uccaIds: [], // Would need to be linked
      classType: scenario.classType || ScenarioClass.Class1
    }));
  }

  private instantiateRequirements(
    template: IndustryTemplate,
    customization: TemplateCustomization
  ): Requirement[] {
    const requirements = template.template.standardRequirements.map((req, index) => ({
      ...req,
      id: `req_${Date.now()}_${index}`,
      code: req.code || `REQ-${index + 1}`,
      type: (req.type as 'Requirement' | 'Mitigation') || 'Requirement',
      text: req.description || '', // Required field
      description: req.description || '',
      verificationMethod: req.verificationMethod,
      linkedScenarioIds: [] // Would need to be linked
    }));

    // Add regulatory requirements if requested
    if (customization.includeRegulations) {
      template.regulations.forEach((reg, index) => {
        const regRequirements = this.getRegulationRequirements(reg);
        regRequirements.forEach((reqText, reqIndex) => {
          requirements.push({
            id: `req_reg_${Date.now()}_${index}_${reqIndex}`,
            code: `REQ-${reg}-${reqIndex + 1}`,
            type: 'Requirement' as const,
            text: reqText,
            description: reqText,
            verificationMethod: 'Compliance audit',
            linkedScenarioIds: []
          });
        });
      });
    }

    return requirements;
  }

  private linkEntities(result: any): void {
    // Link hazards to losses (simplified - would use more sophisticated matching)
    result.hazards.forEach((hazard: Hazard) => {
      if (result.losses.length > 0) {
        hazard.linkedLossIds = [result.losses[0].id];
        if (hazard.title?.toLowerCase().includes('collision') && result.losses.length > 1) {
          hazard.linkedLossIds?.push(result.losses[1].id);
        }
      }
    });

    // Link control actions to controllers
    // Already done in instantiateControlActions

    // Link UCAs to hazards and control actions
    // This would require more sophisticated logic based on context matching
  }

  private getRegulationRequirements(regulation: string): string[] {
    // Simplified - would have comprehensive requirement databases
    const requirements: Record<string, string[]> = {
      'DO-178C': [
        'Software level shall be determined based on failure condition category',
        'Software development shall follow defined lifecycle',
        'All high-level requirements shall be traceable to system requirements'
      ],
      'ISO 26262': [
        'ASIL determination shall be performed for each safety goal',
        'Technical safety requirements shall be derived from safety goals',
        'Hardware and software shall be developed according to assigned ASIL'
      ],
      'IEC 60601': [
        'Single fault condition shall not create unacceptable risk',
        'Essential performance shall be maintained during normal and fault conditions',
        'Alarms shall be prioritized according to urgency'
      ]
    };

    return requirements[regulation] || [];
  }

  private getRegulationReferences(regulation: string): string[] {
    // Simplified reference list
    const references: Record<string, string[]> = {
      'DO-178C': [
        'Section 5: Software Planning Process',
        'Section 6: Software Development Process',
        'Section 11: Software Configuration Management'
      ],
      'ISO 26262': [
        'Part 3: Concept Phase',
        'Part 4: Product Development at System Level',
        'Part 9: ASIL-oriented and Safety-oriented Analysis'
      ]
    };

    return references[regulation] || [];
  }
}

// Export singleton instance
export const industryTemplatesManager = new IndustryTemplatesManager();