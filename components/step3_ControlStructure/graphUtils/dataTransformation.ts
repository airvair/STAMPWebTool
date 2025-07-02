import { Node, Edge } from 'reactflow';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath, ControllerType, TeamRole, CustomNodeData } from '@/types';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
    CONTROLLER_NODE_STYLE,
    NODE_WIDTH,
    BASE_NODE_HEIGHT,
    PARENT_PADDING,
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

    // Pre-calculate which children each controller controls for outgoing handle creation
    const controllerChildrenMap = new Map<string, string[]>();
    controlPaths.forEach(path => {
        const children = controllerChildrenMap.get(path.sourceControllerId) || [];
        if (!children.includes(path.targetId)) {
            children.push(path.targetId);
        }
        controllerChildrenMap.set(path.sourceControllerId, children);
    });

    // Pre-calculate which nodes are targets of control paths for incoming handle creation
    const targetParentsMap = new Map<string, string[]>();
    controlPaths.forEach(path => {
        const parents = targetParentsMap.get(path.targetId) || [];
        if (!parents.includes(path.sourceControllerId)) {
            parents.push(path.sourceControllerId);
        }
        targetParentsMap.set(path.targetId, parents);
    });

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
            // Existing logic for simple controllers
            const children = controllerChildrenMap.get(controller.id) || [];
            const parents = targetParentsMap.get(controller.id) || []; // Get incoming connections
            const numChildren = children.length;
            const numParents = parents.length;

            // Calculate width based on both outgoing and incoming connections
            let nodeWidth = NODE_WIDTH;
            if (numChildren > 1 || numParents > 1) {
                nodeWidth = Math.max(numChildren, numParents) * NODE_WIDTH * 0.7; // Adjusted multiplier for better spacing
                nodeWidth = Math.max(nodeWidth, NODE_WIDTH); // Ensure it's at least default width
            }


            nodes.push({
                id: controller.id,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: {
                    label: controller.name,
                    children: children,
                    parents: parents, // Pass incoming connections count
                    width: nodeWidth,
                    commCount: 0 // Keep existing
                } as CustomNodeData, // Explicitly cast to CustomNodeData
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
        const parents = targetParentsMap.get(component.id) || []; // Get incoming connections
        const numParents = parents.length;

        let nodeWidth = NODE_WIDTH;
        if (numParents > 1) {
            nodeWidth = numParents * NODE_WIDTH * 0.7; // Adjusted multiplier
            nodeWidth = Math.max(nodeWidth, NODE_WIDTH);
        }

        nodes.push({
            id: component.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {
                label: component.name,
                parents: parents, // Pass incoming connections count
                width: nodeWidth,
                commCount: 0
            } as CustomNodeData, // Explicitly cast to CustomNodeData
            style: {
                width: nodeWidth,
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
        const sourceNode = nodes.find(n => n.id === path.sourceControllerId);
        const targetNode = nodes.find(n => n.id === path.targetId);

        let sourceHandle = 'bottom_left';
        if (sourceNode?.data?.children && sourceNode.data.children.length > 1) {
            const childIndex = sourceNode.data.children.indexOf(path.targetId);
            if (childIndex !== -1) {
                sourceHandle = `bottom_control_${childIndex}`;
            }
        }

        let targetHandle = 'top_left';
        if (targetNode?.data?.parents && targetNode.data.parents.length > 1) {
            const parentIndex = targetNode.data.parents.indexOf(path.sourceControllerId);
            if (parentIndex !== -1) {
                targetHandle = `top_control_${parentIndex}`;
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
        const sourceNode = nodes.find(n => n.id === path.sourceId);
        const targetNode = nodes.find(n => n.id === path.targetControllerId);

        let sourceHandle = 'top_right';
        if (sourceNode?.data?.parents && sourceNode.data.parents.length > 1) { // Assuming feedback source is a target of control path, or has multiple incoming feedback paths
            const parentIndex = sourceNode.data.parents.indexOf(path.targetControllerId); // This logic needs careful review depending on exact desired behavior for feedback nodes
            if (parentIndex !== -1) {
                sourceHandle = `top_feedback_${parentIndex}`; // Re-use top handle for feedback target
            }
        }


        let targetHandle = 'bottom_right';
        if (targetNode?.data?.children && targetNode.data.children.length > 1) {
            const childIndex = targetNode.data.children.indexOf(path.sourceId); // Assuming feedback target is also a source of control path
            if (childIndex !== -1) {
                targetHandle = `bottom_feedback_${childIndex}`;
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