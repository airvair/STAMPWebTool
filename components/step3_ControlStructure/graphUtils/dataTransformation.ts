import { Node, Edge } from 'reactflow';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath } from '@/types';
import { useAnalysis } from '@/hooks/useAnalysis';
import { CONTROLLER_NODE_STYLE, NODE_WIDTH, BASE_NODE_HEIGHT, PARENT_PADDING } from '@/constants';

export interface TransformedData {
    nodes: Node[];
    edges: Edge[];
}

export const transformAnalysisData = (
    analysisData: ReturnType<typeof useAnalysis>
): TransformedData => {
    const { controllers, systemComponents, controlPaths, feedbackPaths, communicationPaths } = analysisData;
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    // Pre-calculate which children each controller controls
    const controllerChildrenMap = new Map<string, string[]>();
    controlPaths.forEach(path => {
        const children = controllerChildrenMap.get(path.sourceControllerId) || [];
        if (!children.includes(path.targetId)) {
            children.push(path.targetId);
        }
        controllerChildrenMap.set(path.sourceControllerId, children);
    });

    controllers.forEach(controller => {
        const children = controllerChildrenMap.get(controller.id) || [];
        const numChildren = children.length;

        // Dynamic width for parent nodes based on the number of children
        const nodeWidth = numChildren > 1 ? (NODE_WIDTH * numChildren) + PARENT_PADDING : NODE_WIDTH;

        nodes.push({
            id: controller.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {
                label: controller.name,
                children: children, // Pass children to node for handle creation
                width: nodeWidth, // Pass calculated width for handle positioning
                commCount: 0 // Will be updated later if needed
            },
            style: {
                ...CONTROLLER_NODE_STYLE[controller.ctrlType],
                width: nodeWidth,
                height: BASE_NODE_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderRadius: '0.375rem',
            },
        });
    });

    systemComponents.forEach(component => {
        nodes.push({ id: component.id, type: 'custom', position: { x: 0, y: 0 }, data: { label: component.name, commCount: 0 }, style: { width: NODE_WIDTH, height: BASE_NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000', backgroundColor: '#fff', color: '#000' } });
    });

    controlPaths.forEach(path => {
        const children = controllerChildrenMap.get(path.sourceControllerId) || [];
        const childIndex = children.indexOf(path.targetId);
        const sourceHandle = children.length > 1 && childIndex !== -1 ? `bottom_control_${childIndex}` : 'bottom_left';

        edges.push({
            id: `cp-${path.id}`,
            source: path.sourceControllerId,
            target: path.targetId,
            type: 'custom',
            label: path.controls,
            markerEnd: { type: 'arrowclosed', color: '#FFFFFF' },
            style: { stroke: '#FFFFFF' },
            sourceHandle,
            targetHandle: 'top_left'
        });
    });

    feedbackPaths.forEach(path => {
        const childrenOfTarget = controllerChildrenMap.get(path.targetControllerId) || [];
        const feedbackSourceIndex = childrenOfTarget.indexOf(path.sourceId);
        const targetHandle = childrenOfTarget.length > 1 && feedbackSourceIndex !== -1 ? `bottom_feedback_${feedbackSourceIndex}` : 'bottom_right';

        edges.push({
            id: `fp-${path.id}`,
            source: path.sourceId,
            target: path.targetControllerId,
            type: 'custom',
            label: path.feedback,
            markerEnd: { type: 'arrowclosed', color: '#6ee7b7' },
            style: { stroke: '#6ee7b7' },
            animated: !path.isMissing,
            sourceHandle: 'top_right',
            targetHandle
        });
    });

    communicationPaths.forEach(path => {
        edges.push({
            id: path.id,
            source: path.sourceControllerId,
            target: path.targetControllerId,
            type: 'custom',
            label: path.description,
            style: { stroke: '#888', strokeDasharray: '5 5' }
        });
    });

    return { nodes, edges };
};