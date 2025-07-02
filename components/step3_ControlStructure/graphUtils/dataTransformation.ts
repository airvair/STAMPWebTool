import { Node, Edge } from 'reactflow';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath, ControllerType, TeamRole } from '@/types';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
    CONTROLLER_NODE_STYLE,
    NODE_WIDTH,
    BASE_NODE_HEIGHT,
    PARENT_PADDING,
    CHILD_NODE_SPACING,
    TEAM_NODE_HEADER_HEIGHT,
    TEAM_NODE_PADDING,
    MEMBER_NODE_WIDTH,
    MEMBER_NODE_HEIGHT,
    MEMBER_NODE_SPACING,
} from '@/constants';

export interface TransformedData {
    nodes: Node[];
    edges: Edge[];
}

/**
 * Transforms the analysis data from the context into nodes and edges
 * that can be rendered by React Flow.
 *
 * This function now handles complex team structures by creating a parent container
 * node for the team and nesting individual member nodes inside it. It also
 * considers the active context to display the correct roles for team members.
 */
export const transformAnalysisData = (
    analysisData: ReturnType<typeof useAnalysis>
): TransformedData => {
    const { controllers, systemComponents, controlPaths, feedbackPaths, communicationPaths, activeContexts } = analysisData;
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    // Pre-calculate which children each controller controls for handle creation
    const controllerChildrenMap = new Map<string, string[]>();
    controlPaths.forEach(path => {
        const children = controllerChildrenMap.get(path.sourceControllerId) || [];
        if (!children.includes(path.targetId)) {
            children.push(path.targetId);
        }
        controllerChildrenMap.set(path.sourceControllerId, children);
    });

    // Helper function to calculate node width based on controller type and team details
    const getNodeWidth = (controller: Controller): number => {
        const isComplexTeam = controller.ctrlType === ControllerType.Team &&
            controller.teamDetails &&
            !controller.teamDetails.isSingleUnit &&
            controller.teamDetails.members.length > 0;

        if (isComplexTeam) {
            return MEMBER_NODE_WIDTH + (TEAM_NODE_PADDING * 2);
        }
        return NODE_WIDTH;
    };

    // Calculate parent node widths based on children
    const calculateParentWidth = (parentId: string): number => {
        const children = controllerChildrenMap.get(parentId) || [];
        if (children.length === 0) {
            // No children, use default width based on controller type
            const controller = controllers.find(c => c.id === parentId);
            return controller ? getNodeWidth(controller) : NODE_WIDTH;
        }

        let totalChildrenWidth = 0;
        children.forEach(childId => {
            const childController = controllers.find(c => c.id === childId);
            const childComponent = systemComponents.find(c => c.id === childId);
            
            if (childController) {
                totalChildrenWidth += getNodeWidth(childController);
            } else if (childComponent) {
                totalChildrenWidth += NODE_WIDTH;
            }
        });

        // Add spacing between children (n-1 gaps for n children)
        const totalSpacing = children.length > 1 ? (children.length - 1) * CHILD_NODE_SPACING : 0;
        
        // Parent width includes all children widths plus spacing between them
        return totalChildrenWidth + totalSpacing;
    };

    controllers.forEach(controller => {
        const isComplexTeam = controller.ctrlType === ControllerType.Team &&
            controller.teamDetails &&
            !controller.teamDetails.isSingleUnit &&
            controller.teamDetails.members.length > 0;

        if (isComplexTeam) {
            const memberNodes: Node[] = [];
            const { members, roles, contexts } = controller.teamDetails!;

            // Determine the active context for this team
            const activeContextId = activeContexts[controller.id];
            const activeContext = contexts.find(c => c.id === activeContextId);

            members.forEach((member, index) => {
                let contextualRole: TeamRole | undefined;
                if (activeContext) {
                    const assignment = activeContext.assignments.find(a => a.memberId === member.id);
                    if (assignment) {
                        contextualRole = roles.find(r => r.id === assignment.roleId);
                    }
                }

                // The role to display is the contextual role if available, otherwise fallback to command rank
                const displayRole = contextualRole ? contextualRole.name : member.commandRank;

                memberNodes.push({
                    id: `${controller.id}-${member.id}`,
                    type: 'teamMember',
                    data: {
                        label: member.name,
                        role: displayRole, // Pass the dynamic role
                        commandRank: member.commandRank // Pass the static rank for styling
                    },
                    position: {
                        x: TEAM_NODE_PADDING,
                        y: TEAM_NODE_HEADER_HEIGHT + (index * (MEMBER_NODE_HEIGHT + MEMBER_NODE_SPACING)),
                    },
                    parentNode: controller.id,
                    extent: 'parent',
                    draggable: false,
                    style: {
                        width: MEMBER_NODE_WIDTH,
                        height: MEMBER_NODE_HEIGHT,
                    },
                });
            });

            const containerHeight = TEAM_NODE_HEADER_HEIGHT + (members.length * (MEMBER_NODE_HEIGHT + MEMBER_NODE_SPACING)) + TEAM_NODE_PADDING;
            const containerWidth = MEMBER_NODE_WIDTH + (TEAM_NODE_PADDING * 2);

            nodes.push({
                id: controller.id,
                type: 'custom',
                data: { label: controller.name },
                position: { x: 0, y: 0 },
                style: {
                    ...CONTROLLER_NODE_STYLE[controller.ctrlType],
                    width: containerWidth,
                    height: containerHeight,
                    borderRadius: '0.375rem',
                },
                className: 'team-group-node'
            });

            nodes.push(...memberNodes);

        } else {
            // Calculate parent width based on actual children widths
            const children = controllerChildrenMap.get(controller.id) || [];
            const nodeWidth = calculateParentWidth(controller.id);

            nodes.push({
                id: controller.id,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: {
                    label: controller.name,
                    children: children,
                    width: nodeWidth,
                    commCount: 0
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
        }
    });

    systemComponents.forEach(component => {
        nodes.push({
            id: component.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: { label: component.name, commCount: 0 },
            style: {
                width: NODE_WIDTH,
                height: BASE_NODE_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: '1px solid #333',
                backgroundColor: '#fff',
                color: '#000'
            }
        });
    });

    controlPaths.forEach(path => {
        const children = controllerChildrenMap.get(path.sourceControllerId) || [];
        const childIndex = children.indexOf(path.targetId);
        
        // Calculate the horizontal position of the child relative to parent
        let sourceHandle = 'bottom_left'; // Default to left side (actuator)
        let targetHandle = 'top_left'; // Default to left side (actuator)
        
        if (children.length > 1 && childIndex !== -1) {
            // Parent has multiple children, use indexed source handle (actuator on left)
            sourceHandle = `bottom_control_${childIndex}`;
            // Target child uses simple top handle (or indexed if it also has children)
            const targetChildren = controllerChildrenMap.get(path.targetId) || [];
            if (targetChildren.length > 1) {
                targetHandle = 'top_control_0'; // Child also has children, use its first control handle
            } else {
                targetHandle = 'top_left'; // Simple child, use static handle
            }
        }

        edges.push({
            id: `cp-${path.id}`,
            source: path.sourceControllerId,
            target: path.targetId,
            type: 'custom',
            label: path.controls,
            markerEnd: { type: 'arrowclosed', color: '#FFFFFF' },
            style: { stroke: '#FFFFFF' },
            sourceHandle,
            targetHandle
        });
    });

    feedbackPaths.forEach(path => {
        const childrenOfTarget = controllerChildrenMap.get(path.targetControllerId) || [];
        const feedbackSourceIndex = childrenOfTarget.indexOf(path.sourceId);
        
        let sourceHandle = 'top_right'; // Default to right side (sensor)
        let targetHandle = 'bottom_right'; // Default to right side (sensor)
        
        if (childrenOfTarget.length > 1 && feedbackSourceIndex !== -1) {
            // Target (parent) has multiple children, use indexed handle
            targetHandle = `bottom_feedback_${feedbackSourceIndex}`;
            
            // Source child handle depends on whether it has children
            const sourceChildren = controllerChildrenMap.get(path.sourceId) || [];
            if (sourceChildren.length > 1) {
                sourceHandle = 'top_feedback_0'; // Child has children, use its first feedback handle
            } else {
                sourceHandle = 'top_right'; // Simple child, use static handle
            }
        }

        edges.push({
            id: `fp-${path.id}`,
            source: path.sourceId,
            target: path.targetControllerId,
            type: 'custom',
            label: path.feedback,
            markerEnd: { type: 'arrowclosed', color: '#6ee7b7' },
            style: { stroke: '#6ee7b7' },
            animated: !path.isMissing,
            sourceHandle,
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
