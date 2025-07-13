import { Node, Edge, MarkerType } from 'reactflow';
import { 
  UnsafeControlAction, 
  UCCA, 
  Controller, 
  Hazard, 
  ControlAction
} from '@/types';
import { VisualizationFilters } from '../UCAUCCAVisualization';
import { UCANodeData } from '../nodes/UCANode';
import { UCCANodeData } from '../nodes/UCCANode';
import { ControllerNodeData } from '../nodes/ControllerNode';
import { HazardNodeData } from '../nodes/HazardNode';

interface TransformOptions {
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  controllers: Controller[];
  hazards: Hazard[];
  controlActions: ControlAction[];
  filters: VisualizationFilters;
}

export interface FlowElements {
  nodes: Node[];
  edges: Edge[];
}

const matchesSearchTerm = (searchTerm: string, ...fields: (string | undefined)[]): boolean => {
  const term = searchTerm.toLowerCase();
  return fields.some(field => field?.toLowerCase().includes(term));
};

const shouldShowController = (controller: Controller, filters: VisualizationFilters): boolean => {
  if (!filters.showControllers) return false;
  if (filters.selectedControllers.length > 0 && !filters.selectedControllers.includes(controller.id)) {
    return false;
  }
  if (filters.searchTerm) {
    return matchesSearchTerm(filters.searchTerm, controller.name, controller.description);
  }
  return true;
};

const shouldShowUCA = (uca: UnsafeControlAction, filters: VisualizationFilters): boolean => {
  if (!filters.showUCAs) return false;
  if (filters.selectedControllers.length > 0 && !filters.selectedControllers.includes(uca.controllerId)) {
    return false;
  }
  if (filters.selectedHazards.length > 0 && !uca.hazardIds.some(h => filters.selectedHazards.includes(h))) {
    return false;
  }
  if (filters.ucaTypes.length > 0 && !filters.ucaTypes.includes(uca.ucaType)) {
    return false;
  }
  if (filters.searchTerm) {
    return matchesSearchTerm(filters.searchTerm, uca.code, uca.description, uca.context);
  }
  return true;
};

const shouldShowUCCA = (ucca: UCCA, filters: VisualizationFilters): boolean => {
  if (!filters.showUCCAs) return false;
  if (filters.selectedControllers.length > 0 && 
      !ucca.involvedControllerIds.some(c => filters.selectedControllers.includes(c))) {
    return false;
  }
  if (filters.selectedHazards.length > 0 && !ucca.hazardIds.some(h => filters.selectedHazards.includes(h))) {
    return false;
  }
  if (filters.uccaTypes.length > 0 && !filters.uccaTypes.includes(ucca.uccaType)) {
    return false;
  }
  if (filters.searchTerm) {
    return matchesSearchTerm(filters.searchTerm, ucca.code, ucca.description, ucca.context);
  }
  return true;
};

const shouldShowHazard = (hazard: Hazard, filters: VisualizationFilters): boolean => {
  if (!filters.showHazards) return false;
  if (filters.selectedHazards.length > 0 && !filters.selectedHazards.includes(hazard.id)) {
    return false;
  }
  if (filters.searchTerm) {
    return matchesSearchTerm(filters.searchTerm, hazard.code, hazard.title, hazard.systemComponent);
  }
  return true;
};

export const transformDataToFlowElements = (options: TransformOptions): FlowElements => {
  const { ucas, uccas, controllers, hazards, controlActions, filters } = options;
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();

  // Create controller nodes
  controllers.forEach((controller) => {
    if (!shouldShowController(controller, filters)) return;

    const controllerActions = controlActions.filter(ca => ca.controllerId === controller.id);
    const controllerUCAs = ucas.filter(uca => uca.controllerId === controller.id);
    const isInvolvedInUCCA = uccas.some(ucca => ucca.involvedControllerIds.includes(controller.id));

    const node: Node<ControllerNodeData> = {
      id: `controller-${controller.id}`,
      type: 'controller',
      position: { x: 0, y: 0 }, // Will be set by layout engine
      data: {
        label: controller.name,
        ctrlType: controller.ctrlType,
        description: controller.description,
        responsibilities: controller.responsibilities,
        controlActionCount: controllerActions.length,
        ucaCount: controllerUCAs.length,
        isInvolvedInUCCA,
      },
    };
    nodes.push(node);
    nodeMap.set(node.id, node);
  });

  // Create UCA nodes
  ucas.forEach((uca) => {
    if (!shouldShowUCA(uca, filters)) return;

    const hazardCodes = uca.hazardIds
      .map(hId => hazards.find(h => h.id === hId)?.code)
      .filter(Boolean) as string[];

    const node: Node<UCANodeData> = {
      id: `uca-${uca.id}`,
      type: 'uca',
      position: { x: 0, y: 0 },
      data: {
        label: uca.description || `${uca.ucaType} - ${uca.context}`,
        ucaType: uca.ucaType,
        context: uca.context,
        hazards: hazardCodes,
        code: uca.code,
        description: uca.description,
        riskCategory: uca.riskCategory,
      },
    };
    nodes.push(node);
    nodeMap.set(node.id, node);

    // Create edge from controller to UCA
    const controllerNodeId = `controller-${uca.controllerId}`;
    if (nodeMap.has(controllerNodeId)) {
      edges.push({
        id: `${controllerNodeId}-${node.id}`,
        source: controllerNodeId,
        target: node.id,
        type: 'relationship',
        animated: true,
        style: { stroke: '#ef4444' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ef4444',
        },
      });
    }
  });

  // Create UCCA nodes
  uccas.forEach((ucca) => {
    if (!shouldShowUCCA(ucca, filters)) return;

    const hazardCodes = ucca.hazardIds
      .map(hId => hazards.find(h => h.id === hId)?.code)
      .filter(Boolean) as string[];

    const involvedControllerNames = ucca.involvedControllerIds
      .map(cId => controllers.find(c => c.id === cId)?.name)
      .filter(Boolean) as string[];

    const node: Node<UCCANodeData> = {
      id: `ucca-${ucca.id}`,
      type: 'ucca',
      position: { x: 0, y: 0 },
      data: {
        label: ucca.code,
        uccaType: ucca.uccaType,
        context: ucca.context,
        hazards: hazardCodes,
        code: ucca.code,
        description: ucca.description,
        involvedControllers: involvedControllerNames,
        temporalRelationship: ucca.temporalRelationship,
        isSystematic: ucca.isSystematic,
      },
    };
    nodes.push(node);
    nodeMap.set(node.id, node);

    // Create edges from involved controllers to UCCA
    ucca.involvedControllerIds.forEach((controllerId) => {
      const controllerNodeId = `controller-${controllerId}`;
      if (nodeMap.has(controllerNodeId)) {
        edges.push({
          id: `${controllerNodeId}-${node.id}`,
          source: controllerNodeId,
          target: node.id,
          type: 'relationship',
          animated: true,
          style: { stroke: '#f97316', strokeDasharray: '5 5' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#f97316',
          },
        });
      }
    });
  });

  // Create hazard nodes
  hazards.forEach((hazard) => {
    if (!shouldShowHazard(hazard, filters)) return;

    const linkedUCAs = ucas.filter(uca => uca.hazardIds.includes(hazard.id));
    const linkedUCCAs = uccas.filter(ucca => ucca.hazardIds.includes(hazard.id));

    const node: Node<HazardNodeData> = {
      id: `hazard-${hazard.id}`,
      type: 'hazard',
      position: { x: 0, y: 0 },
      data: {
        label: hazard.code,
        code: hazard.code,
        title: hazard.title,
        systemComponent: hazard.systemComponent,
        environmentalCondition: hazard.environmentalCondition,
        systemState: hazard.systemState,
        severity: hazard.severity,
        linkedUCACount: linkedUCAs.length,
        linkedUCCACount: linkedUCCAs.length,
        linkedLossCount: hazard.linkedLossIds?.length || 0,
      },
    };
    nodes.push(node);
    nodeMap.set(node.id, node);

    // Create edges from UCAs to hazards
    linkedUCAs.forEach((uca) => {
      const ucaNodeId = `uca-${uca.id}`;
      if (nodeMap.has(ucaNodeId)) {
        edges.push({
          id: `${ucaNodeId}-${node.id}`,
          source: ucaNodeId,
          target: node.id,
          type: 'hazardLink',
          style: { stroke: '#eab308', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#eab308',
          },
        });
      }
    });

    // Create edges from UCCAs to hazards
    linkedUCCAs.forEach((ucca) => {
      const uccaNodeId = `ucca-${ucca.id}`;
      if (nodeMap.has(uccaNodeId)) {
        edges.push({
          id: `${uccaNodeId}-${node.id}`,
          source: uccaNodeId,
          target: node.id,
          type: 'hazardLink',
          style: { stroke: '#eab308', strokeWidth: 2, strokeDasharray: '3 3' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#eab308',
          },
        });
      }
    });
  });

  return { nodes, edges };
};