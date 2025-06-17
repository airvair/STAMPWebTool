// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/ControlStructureGraph.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, useNodesState, useEdgesState, Panel, useReactFlow, ReactFlowProvider, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { CustomEdge, CustomNode } from './CustomGraphElements';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath, ControllerType, ControlAction, TeamRole, TeamMember } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';
import { CONTROLLER_TYPE_FILL_COLORS } from '../../constants';

const LayoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" > <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 0 0113.5 18v-2.25z" /> </svg> );

const NODE_WIDTH = 180;
const BASE_NODE_HEIGHT = 60;
const TEAM_CONTAINER_PADDING = 20;

interface TransformedData {
    nodes: Node[];
    edges: Edge[];
}

const transformAnalysisData = (
    analysisData: ReturnType<typeof useAnalysis>
): TransformedData => {
    const { controllers, systemComponents, controlPaths, feedbackPaths, communicationPaths, controlActions, activeContexts } = analysisData;
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    controllers.forEach(controller => {
        const isComplexTeam = controller.ctrlType === ControllerType.Team && !controller.teamDetails?.isSingleUnit;
        const activeContextId = activeContexts && activeContexts.hasOwnProperty(controller.id) ? activeContexts?.[controller.id] : undefined;
        const activeContext = controller.teamDetails?.contexts.find(c => c.id === activeContextId);

        if (isComplexTeam && activeContext) {
            // TEAM CONTAINER NODE
            const teamContainerId = `team-container-${controller.id}`;
            nodes.push({
                id: teamContainerId,
                type: 'group',
                position: { x: 0, y: 0 },
                data: { label: controller.name },
                style: {
                    border: '2px dashed #ccc',
                    padding: `${TEAM_CONTAINER_PADDING}px`,
                    backgroundColor: 'rgba(200, 200, 200, 0.1)',
                },
            });

            // MEMBER NODES WITHIN THE TEAM
            activeContext.assignments.forEach(assignment => {
                const member = controller.teamDetails?.members.find(m => m.id === assignment.memberId);
                const role = controller.teamDetails?.roles.find(r => r.id === assignment.roleId);
                if (member && role) {
                    nodes.push({
                        id: `${controller.id}-${member.id}`,
                        type: 'custom',
                        position: { x: TEAM_CONTAINER_PADDING, y: TEAM_CONTAINER_PADDING + (activeContext.assignments.findIndex(a => a.memberId === member.id) * (BASE_NODE_HEIGHT + 10)) }, // Initial relative positioning
                        data: { label: `${member.name}\n(${role.name})` },
                        style: {
                            backgroundColor: CONTROLLER_TYPE_FILL_COLORS.H, // Assuming team members are human-like
                            width: NODE_WIDTH, height: BASE_NODE_HEIGHT,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000',
                        },
                        parentNode: teamContainerId,
                        extent: 'parent',
                    });
                }
            });
        } else {
            // STANDARD CONTROLLER NODE
            nodes.push({
                id: controller.id,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: { label: controller.name },
                style: {
                    backgroundColor: CONTROLLER_TYPE_FILL_COLORS.hasOwnProperty(controller.ctrlType) ? CONTROLLER_TYPE_FILL_COLORS?.[controller.ctrlType] : '#eee',
                    width: NODE_WIDTH, height: BASE_NODE_HEIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000',
                },
            });
        }
    });

    systemComponents.forEach(component => {
        nodes.push({
            id: component.id, type: 'default', position: { x: 0, y: 0 }, data: { label: component.name },
            style: { width: NODE_WIDTH, height: BASE_NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000' },
        });
    });

    controlPaths.forEach(path => {
        const sourceController = controllers.find(c => c.id === path.sourceControllerId);
        const associatedActions = controlActions.filter(ca => ca.controlPathId === path.id);

        if (sourceController?.ctrlType === ControllerType.Team && !sourceController.teamDetails?.isSingleUnit && activeContexts?.[sourceController.id]) {
            // DYNAMIC EDGE MAPPING FOR TEAMS
            const activeContext = sourceController.teamDetails?.contexts.find(c => c.id === activeContexts?.[sourceController.id]);
            if (!activeContext) return;

            const actionsByRole = new Map<string, ControlAction[]>();
            associatedActions.forEach(action => {
                const roleId = action.roleId || 'default';
                if (!actionsByRole.has(roleId)) actionsByRole.set(roleId, []);
                actionsByRole.get(roleId)!.push(action);
            });

            actionsByRole.forEach((actions, roleId) => {
                const memberAssignment = activeContext.assignments.find(a => a.roleId === roleId);
                const memberId = memberAssignment?.memberId;
                if(memberId) {
                    edges.push({
                        id: `cp-${path.id}-${roleId}`,
                        source: `${sourceController.id}-${memberId}`,
                        target: path.targetId,
                        type: 'custom',
                        label: actions.map(a => `${a.verb} ${a.object}`).join(', '),
                        markerEnd: { type: 'arrowclosed', color: '#000' },
                        style: { stroke: '#000' }
                    });
                }
            });

        } else {
            // Standard edge mapping
            edges.push({
                id: `cp-${path.id}`, source: path.sourceControllerId, target: path.targetId, type: 'custom', label: path.controls,
                markerEnd: { type: 'arrowclosed', color: '#000' }, style: { stroke: '#000' },
            });
        }
    });

    feedbackPaths.forEach(path => {
        edges.push({
            id: `fp-${path.id}`, source: path.sourceId, target: path.targetControllerId, type: 'custom', label: path.feedback,
            markerEnd: { type: 'arrowclosed', color: '#000' }, style: { stroke: '#16a34a' }, animated: !path.isMissing
        });
    });

    // Remove the ranking edges as nesting should handle the visual hierarchy
    // controllers.forEach(c => {
    //     if(c.ctrlType === ControllerType.Team && !c.teamDetails?.isSingleUnit && activeContexts?.[c.id]) {
    //         const activeContext = c.teamDetails?.contexts.find(ctx => ctx.id === activeContexts?.[c.id]);
    //         if(!activeContext) return;
    //         const pmRole = c.teamDetails?.roles.find(r => r.name.toLowerCase().includes('monitor'));
    //         const pfRole = c.teamDetails?.roles.find(r => r.name.toLowerCase().includes('fly') || r.name.toLowerCase().includes('operat'));
    //         if(pmRole && pfRole) {
    //             const pmAssignment = activeContext.assignments.find(a => a.roleId === pmRole.id);
    //             const pfAssignment = activeContext.assignments.find(a => a.roleId === pfRole.id);
    //             if(pmAssignment && pfAssignment) {
    //                 const pmNodeId = `${c.id}-${pmAssignment.memberId}`;
    //                 const pfNodeId = `${c.id}-${pfAssignment.memberId}`;
    //                 edges.push({id: `rank-${pmNodeId}-${pfNodeId}`, source: pmNodeId, target: pfNodeId, style: {visibility: 'hidden'}});
    //             }
    //         }
    //     }
    // });

    return { nodes, edges };
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 150, ranksep: 100 });

    // Only layout top-level nodes (those without a parentNode)
    nodes.filter(node => !node.parentNode).forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH + (node.type === 'group' ? 2 * TEAM_CONTAINER_PADDING : 0), height: BASE_NODE_HEIGHT * (node.type === 'group' ? (node.data.memberCount || 1) : 1) + (node.type === 'group' ? 2 * TEAM_CONTAINER_PADDING : 0) }); // Adjust height for team containers
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes: Node[] = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition && !node.parentNode) {
            return { ...node, position: { x: nodeWithPosition.x - (NODE_WIDTH / 2) - (node.type === 'group' ? TEAM_CONTAINER_PADDING : 0), y: nodeWithPosition.y - (BASE_NODE_HEIGHT * (node.data.memberCount || 1) / 2) - (node.type === 'group' ? TEAM_CONTAINER_PADDING : 0) } };
        }
        return node;
    });

    return {
        nodes: layoutedNodes,
        edges,
    };
};

const GraphCanvas: React.FC = () => {
    const analysisData = useAnalysis();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => transformAnalysisData(analysisData), [analysisData, analysisData.activeContexts]);

    // Update member count for layouting team containers
    const nodesWithMemberCount = useMemo(() => {
        return initialNodes.map(node => {
            if (node.type === 'group') {
                const memberCount = initialNodes.filter(n => n.parentNode === node.id).length;
                return { ...node, data: { ...node.data, memberCount }, style: { ...node.style, height: `${(memberCount * (BASE_NODE_HEIGHT + 10)) + (2 * TEAM_CONTAINER_PADDING)}px` } };
            }
            return node;
        });
    }, [initialNodes]);


    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodesWithMemberCount, initialEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        window.setTimeout(() => fitView({ duration: 500 }), 50);
    }, [nodesWithMemberCount, initialEdges, setNodes, setEdges, fitView]);

    useEffect(() => {
        onLayout();
    }, [nodesWithMemberCount.length, initialEdges.length, analysisData.activeContexts, onLayout]);


    const nodeTypes = useMemo(() => ({ custom: CustomNode, group: ({ id, data, style, children }) => ( <div style={style} className="bg-gray-100 rounded-md border border-dashed border-gray-500 p-2"> <strong className="block text-center text-slate-700 mb-1">{data.label}</strong> {children} </div> ) }), []);
    const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            proOptions={{ hideAttribution: true }}
            fitView
            zoomOnDoubleClick={false}
        >
            <Panel position="top-right">
                <button onClick={onLayout} className="p-2 bg-white rounded-md shadow-md hover:bg-gray-100 border border-gray-300" title="Organize Layout" >
                    <LayoutIcon />
                </button>
            </Panel>
            <Background />
            <Controls />
        </ReactFlow>
    );
}

const ControlStructureGraph = () => {
    return (
        <ReactFlowProvider>
            <GraphCanvas />
        </ReactFlowProvider>
    );
};

export default ControlStructureGraph;