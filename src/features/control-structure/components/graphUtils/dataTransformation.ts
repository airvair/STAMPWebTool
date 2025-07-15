import { Node, Edge, MarkerType } from 'reactflow';
import {
    CONTROLLER_NODE_STYLE,
    NODE_WIDTH,
    BASE_NODE_HEIGHT,
    CHILD_NODE_SPACING,
    TEAM_NODE_HEADER_HEIGHT,
    TEAM_NODE_PADDING,
    MEMBER_NODE_WIDTH,
    MEMBER_NODE_HEIGHT,
    MEMBER_NODE_SPACING,
} from '@/utils/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Controller, ControllerType, TeamRole } from '@/types/types';

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
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Pre-calculate which children each controller controls for handle creation
    const controllerChildrenMap = new Map<string, string[]>();
    controlPaths.forEach(path => {
        const children = controllerChildrenMap.get(path.sourceControllerId) || [];
        if (!children.includes(path.targetId)) {
            children.push(path.targetId);
        }
        controllerChildrenMap.set(path.sourceControllerId, children);
    });

    // Create reverse mapping: which parents control each target
    const childParentsMap = new Map<string, string[]>();
    controlPaths.forEach(path => {
        const parents = childParentsMap.get(path.targetId) || [];
        if (!parents.includes(path.sourceControllerId)) {
            parents.push(path.sourceControllerId);
        }
        childParentsMap.set(path.targetId, parents);
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

    // Helper function to find all grandchildren that a parent controls directly
    const getDirectGrandchildren = (parentId: string): string[] => {
        const directChildren = controllerChildrenMap.get(parentId) || [];
        const grandchildren: string[] = [];
        
        // Find all control paths from this parent
        controlPaths.forEach(path => {
            if (path.sourceControllerId === parentId) {
                // Check if this target is NOT a direct child (making it a grandchild or deeper)
                if (!directChildren.includes(path.targetId)) {
                    grandchildren.push(path.targetId);
                }
            }
        });
        
        return grandchildren;
    };

    // Calculate parent node widths based on children and direct grandchild connections
    const calculateParentWidth = (parentId: string, visited = new Set<string>()): number => {
        // Prevent infinite recursion from circular references
        if (visited.has(parentId)) {
            const controller = controllers.find(c => c.id === parentId);
            return controller ? getNodeWidth(controller) : NODE_WIDTH;
        }
        visited.add(parentId);

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
                // Check if this child is large because it's a parent (has children) 
                // vs being large because it has multiple parents
                const childChildren = controllerChildrenMap.get(childId) || [];
                
                if (childChildren.length > 0) {
                    // Child is large because it's a parent - use its calculated parent width
                    totalChildrenWidth += calculateParentWidth(childId, new Set(visited));
                } else {
                    // Child is simple OR large due to multiple parents - use base width
                    totalChildrenWidth += getNodeWidth(childController);
                }
            } else if (childComponent) {
                totalChildrenWidth += NODE_WIDTH;
            }
        });

        // Add spacing between children (n-1 gaps for n children)
        const totalSpacing = children.length > 1 ? (children.length - 1) * CHILD_NODE_SPACING : 0;
        
        // Check for direct grandchild connections that require additional width
        const directGrandchildren = getDirectGrandchildren(parentId);
        let additionalWidth = 0;
        
        if (directGrandchildren.length > 0) {
            // Add one NODE_WIDTH for each additional actuator needed for grandchild connections
            // This ensures the parent can accommodate extra actuator positions
            additionalWidth = NODE_WIDTH;
        }
        
        // Parent width includes all children widths plus spacing plus additional width for grandchild connections
        return totalChildrenWidth + totalSpacing + additionalWidth;
    };

    // Calculate target node widths based on multiple parents controlling it
    const calculateTargetWidth = (targetId: string): number => {
        const parents = childParentsMap.get(targetId) || [];
        if (parents.length <= 1) {
            // Single or no parent, use default width
            const controller = controllers.find(c => c.id === targetId);
            return controller ? getNodeWidth(controller) : NODE_WIDTH;
        }

        // Multiple parents - calculate combined width needed
        let totalParentWidths = 0;
        parents.forEach(parentId => {
            const parentController = controllers.find(c => c.id === parentId);
            if (parentController) {
                // Use the parent's own base width, not its calculated parent width
                totalParentWidths += getNodeWidth(parentController);
            } else {
                // Fallback to standard width
                totalParentWidths += NODE_WIDTH;
            }
        });

        // Add spacing between incoming arrows (n-1 gaps for n parents)
        const totalSpacing = parents.length > 1 ? (parents.length - 1) * CHILD_NODE_SPACING : 0;
        
        return totalParentWidths + totalSpacing;
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
            // Calculate width based on both parent and target requirements
            const children = controllerChildrenMap.get(controller.id) || [];
            const directGrandchildren = getDirectGrandchildren(controller.id);
            const parents = childParentsMap.get(controller.id) || [];
            
            const parentWidth = calculateParentWidth(controller.id);
            const targetWidth = calculateTargetWidth(controller.id);
            const nodeWidth = Math.max(parentWidth, targetWidth);

            // Calculate parent widths for multi-parent target positioning
            const parentWidths = parents.map(parentId => {
                const parentController = controllers.find(c => c.id === parentId);
                return parentController ? getNodeWidth(parentController) : NODE_WIDTH;
            });

            nodes.push({
                id: controller.id,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: {
                    label: controller.name,
                    children: children,
                    grandchildren: directGrandchildren,
                    parents: parents,
                    parentWidths: parentWidths,
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
        // System components can also be targets of multiple parents
        const parents = childParentsMap.get(component.id) || [];
        const targetWidth = calculateTargetWidth(component.id);
        const componentWidth = Math.max(NODE_WIDTH, targetWidth);

        // Calculate parent widths for multi-parent target positioning
        const parentWidths = parents.map(parentId => {
            const parentController = controllers.find(c => c.id === parentId);
            return parentController ? getNodeWidth(parentController) : NODE_WIDTH;
        });

        nodes.push({
            id: component.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: { 
                label: component.name, 
                parents: parents,
                parentWidths: parentWidths,
                width: componentWidth,
                commCount: 0 
            },
            style: {
                width: componentWidth,
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
        const directGrandchildren = getDirectGrandchildren(path.sourceControllerId);
        const isGrandchildConnection = !children.includes(path.targetId) && directGrandchildren.includes(path.targetId);
        
        // Check if target has multiple parents
        const targetParents = childParentsMap.get(path.targetId) || [];
        const hasMultipleParents = targetParents.length > 1;
        
        // Calculate the horizontal position of the child relative to parent
        let sourceHandle = 'bottom_left'; // Default to left side (actuator)
        let targetHandle = 'top_left'; // Default to left side (actuator)
        
        if (hasMultipleParents) {
            // Target has multiple parents - use indexed target handle
            const parentIndex = targetParents.indexOf(path.sourceControllerId);
            targetHandle = `top_multiparent_${parentIndex}`;
            
            // For the source, still use the appropriate control handle if parent has multiple children
            if (children.length > 1 && childIndex !== -1) {
                sourceHandle = `bottom_control_${childIndex}`;
            } else {
                sourceHandle = 'bottom_left'; // Single child, use left actuator
            }
        } else if (isGrandchildConnection) {
            // This is a direct grandchild connection - use additional handle on the left
            const grandchildIndex = directGrandchildren.indexOf(path.targetId);
            sourceHandle = `bottom_grandchild_${grandchildIndex}`;
            
            // Target handle depends on whether the grandchild has children
            const targetChildren = controllerChildrenMap.get(path.targetId) || [];
            if (targetChildren.length > 1) {
                targetHandle = 'top_control_0'; // Grandchild also has children
            } else {
                targetHandle = 'top_left'; // Simple grandchild
            }
        } else if (children.length > 1 && childIndex !== -1) {
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
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, // Blue
            style: { stroke: '#3b82f6', strokeWidth: '2px' }, // Blue with thicker line
            sourceHandle,
            targetHandle
        });
    });

    feedbackPaths.forEach(path => {
        const childrenOfTarget = controllerChildrenMap.get(path.targetControllerId) || [];
        const feedbackSourceIndex = childrenOfTarget.indexOf(path.sourceId);
        
        // Check if source has multiple parents (for vertical feedback alignment)
        const sourceParents = childParentsMap.get(path.sourceId) || [];
        const sourceHasMultipleParents = sourceParents.length > 1;
        
        let sourceHandle = 'top_right'; // Default to right side (sensor)
        let targetHandle = 'bottom_right'; // Default to right side (sensor)
        
        if (sourceHasMultipleParents) {
            // Source has multiple parents - use indexed feedback alignment
            const parentIndex = sourceParents.indexOf(path.targetControllerId);
            sourceHandle = `top_multiparent_feedback_${parentIndex}`;
            
            // Target (parent) handle depends on whether parent has multiple children
            if (childrenOfTarget.length > 1 && feedbackSourceIndex !== -1) {
                targetHandle = `bottom_feedback_${feedbackSourceIndex}`;
            } else {
                targetHandle = 'bottom_right'; // Single child or fallback
            }
        } else if (childrenOfTarget.length > 1 && feedbackSourceIndex !== -1) {
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
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }, // Red
            style: { stroke: '#ef4444', strokeWidth: '2px' }, // Red with thicker line
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
