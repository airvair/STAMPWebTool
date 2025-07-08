import { HardwareComponent, FailureMode, Controller, ControlAction, FailureType } from '@/types';

export interface HardwareUCATemplate {
  controllerId: string;
  controlActionId: string;
  ucaType: 'Not Provided' | 'Provided Unsafely' | 'Too Early' | 'Too Late' | 'Wrong Order' | 'Too Long' | 'Too Short';
  contextTemplate: string;
  hardwareComponentId: string;
  failureModeId?: string;
  priority: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface ControllerHardwareMapping {
  controllerId: string;
  relatedHardwareComponents: HardwareComponent[];
  criticalFailureModes: FailureMode[];
  recommendedUCAs: HardwareUCATemplate[];
}

/**
 * Maps hardware components to controllers based on system relationships
 */
export function mapHardwareToControllers(
  controllers: Controller[],
  controlActions: ControlAction[],
  hardwareComponents: HardwareComponent[],
  failureModes: FailureMode[]
): ControllerHardwareMapping[] {
  const mappings: ControllerHardwareMapping[] = [];

  for (const controller of controllers) {
    const controllerActions = controlActions.filter(ca => ca.controllerId === controller.id);
    
    // Find hardware components related to this controller
    const relatedHardware = findRelatedHardware(controller, controllerActions, hardwareComponents);
    
    // Find critical failure modes for this hardware
    const criticalFailures = findCriticalFailureModes(relatedHardware, failureModes);
    
    // Generate recommended UCAs based on hardware analysis
    const recommendedUCAs = generateHardwareBasedUCAs(
      controller, 
      controllerActions, 
      relatedHardware, 
      criticalFailures
    );

    mappings.push({
      controllerId: controller.id,
      relatedHardwareComponents: relatedHardware,
      criticalFailureModes: criticalFailures,
      recommendedUCAs
    });
  }

  return mappings;
}

/**
 * Finds hardware components related to a controller based on naming and relationships
 */
function findRelatedHardware(
  controller: Controller,
  controlActions: ControlAction[],
  hardwareComponents: HardwareComponent[]
): HardwareComponent[] {
  const related: HardwareComponent[] = [];
  
  // Simple heuristic: match by name similarity and system component relationships
  for (const hardware of hardwareComponents) {
    // Check if hardware name contains controller name or vice versa
    const nameMatch = hardware.name.toLowerCase().includes(controller.name.toLowerCase()) ||
                     controller.name.toLowerCase().includes(hardware.name.toLowerCase());
    
    // Check if hardware is linked to controller's system component
    const systemMatch = false; // Controller doesn't have systemComponentId property
    
    // Check if any control actions reference this hardware
    const actionMatch = controlActions.some(action => 
      action.object.toLowerCase().includes(hardware.name.toLowerCase()) ||
      action.verb.toLowerCase().includes(hardware.type.toLowerCase())
    );

    if (nameMatch || systemMatch || actionMatch) {
      related.push(hardware);
    }
  }

  return related;
}

/**
 * Identifies critical failure modes based on severity and probability
 */
function findCriticalFailureModes(
  hardwareComponents: HardwareComponent[],
  failureModes: FailureMode[]
): FailureMode[] {
  const hardwareIds = new Set(hardwareComponents.map(h => h.id));
  
  return failureModes
    .filter(fm => hardwareIds.has(fm.hardwareComponentId))
    .filter(fm => fm.severityLevel === 'High' || fm.severityLevel === 'Critical')
    .sort((a, b) => {
      const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return severityOrder[b.severityLevel as keyof typeof severityOrder] - severityOrder[a.severityLevel as keyof typeof severityOrder];
    });
}

/**
 * Generates UCA templates based on hardware failure analysis
 */
function generateHardwareBasedUCAs(
  controller: Controller,
  controlActions: ControlAction[],
  hardwareComponents: HardwareComponent[],
  criticalFailures: FailureMode[]
): HardwareUCATemplate[] {
  const templates: HardwareUCATemplate[] = [];

  for (const action of controlActions) {
    for (const failure of criticalFailures) {
      const hardware = hardwareComponents.find(h => h.id === failure.hardwareComponentId);
      if (!hardware) continue;

      // Generate different UCA types based on failure type
      const ucaTemplates = generateUCATemplatesForFailure(
        controller,
        action,
        hardware,
        failure
      );
      
      templates.push(...ucaTemplates);
    }
  }

  return templates;
}

/**
 * Generates specific UCA templates for a hardware failure mode
 */
function generateUCATemplatesForFailure(
  controller: Controller,
  action: ControlAction,
  hardware: HardwareComponent,
  failure: FailureMode
): HardwareUCATemplate[] {
  const templates: HardwareUCATemplate[] = [];

  switch (failure.failureType) {
    case 'Mechanical' as FailureType:
      templates.push(
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Not Provided',
          contextTemplate: `${hardware.name} mechanical failure prevents ${action.verb} ${action.object} when needed`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: failure.severityLevel === 'Critical' ? 'High' : 'Medium',
          reasoning: `Mechanical failure of ${hardware.name} (${failure.description}) could prevent necessary control action`
        },
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Provided Unsafely',
          contextTemplate: `${hardware.name} mechanical degradation causes unsafe ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'Medium',
          reasoning: `Partial mechanical failure could lead to improper control action execution`
        }
      );
      break;

    case 'Electrical' as FailureType:
      templates.push(
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Not Provided',
          contextTemplate: `Electrical failure in ${hardware.name} prevents ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: failure.severityLevel === 'Critical' ? 'High' : 'Medium',
          reasoning: `Electrical failure could completely disable control capability`
        },
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Too Late',
          contextTemplate: `Electrical degradation in ${hardware.name} delays ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'Medium',
          reasoning: `Electrical issues could cause timing delays in control actions`
        }
      );
      break;

    case 'Software' as FailureType:
      templates.push(
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Provided Unsafely',
          contextTemplate: `Software bug in ${hardware.name} causes incorrect ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'High',
          reasoning: `Software failures can lead to unpredictable and unsafe control actions`
        },
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Wrong Order',
          contextTemplate: `Software malfunction in ${hardware.name} causes ${action.verb} ${action.object} in wrong sequence`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'Medium',
          reasoning: `Software errors can disrupt proper sequencing of control actions`
        }
      );
      break;

    case 'Environmental' as FailureType:
      templates.push(
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Too Early',
          contextTemplate: `Environmental stress on ${hardware.name} triggers premature ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'Medium',
          reasoning: `Environmental factors could cause premature activation`
        },
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Too Long',
          contextTemplate: `Environmental damage to ${hardware.name} prevents stopping ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'High',
          reasoning: `Environmental damage could prevent proper control action termination`
        }
      );
      break;

    case 'Wear' as FailureType:
      templates.push(
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Provided Unsafely',
          contextTemplate: `Wear in ${hardware.name} causes insufficient or excessive ${action.verb} ${action.object}`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: 'Medium',
          reasoning: `Component wear can lead to degraded performance and unsafe operation`
        }
      );
      break;

    default:
      templates.push(
        {
          controllerId: controller.id,
          controlActionId: action.id,
          ucaType: 'Not Provided',
          contextTemplate: `Failure of ${hardware.name} prevents ${action.verb} ${action.object} when required`,
          hardwareComponentId: hardware.id,
          failureModeId: failure.id,
          priority: failure.severityLevel === 'Critical' ? 'High' : 'Low',
          reasoning: `General hardware failure could impact control capability`
        }
      );
  }

  return templates;
}

/**
 * Filters hardware-based UCA templates to remove duplicates and low-priority items
 */
export function filterHardwareUCATemplates(
  templates: HardwareUCATemplate[],
  maxTemplatesPerController: number = 10
): HardwareUCATemplate[] {
  // Group by controller
  const byController = new Map<string, HardwareUCATemplate[]>();
  
  templates.forEach(template => {
    if (!byController.has(template.controllerId)) {
      byController.set(template.controllerId, []);
    }
    byController.get(template.controllerId)!.push(template);
  });

  const filtered: HardwareUCATemplate[] = [];

  // Filter each controller's templates
  byController.forEach((controllerTemplates) => {
    // Sort by priority and remove duplicates
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sorted = controllerTemplates
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, maxTemplatesPerController);

    // Remove near-duplicates (same UCA type and similar context)
    const unique = sorted.filter((template, index) => {
      return !sorted.slice(0, index).some(existing => 
        existing.ucaType === template.ucaType &&
        existing.controlActionId === template.controlActionId &&
        similar(existing.contextTemplate, template.contextTemplate, 0.8)
      );
    });

    filtered.push(...unique);
  });

  return filtered;
}

/**
 * Simple string similarity check
 */
function similar(str1: string, str2: string, threshold: number): boolean {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarity >= threshold;
}