// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/ControlStructureGraph.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, useNodesState, useEdgesState, Panel, useReactFlow, ReactFlowProvider, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { CustomEdge, CustomNode } from './CustomGraphElements';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath, ControllerType, ControlAction, TeamRole, TeamMember, RoleAssignment } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';
import { CONTROLLER_TYPE_FILL_COLORS } from '../../constants';

const LayoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" > <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /> </svg> );

const NODE_WIDTH = 180;
const BASE_NODE_HEIGHT = 60;
const TEAM_CONTAINER_PADDING = 20;
const TEAM_HEADER_HEIGHT = 40; // Added for top padding inside container

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
        const activeContextId = activeContexts?.[controller.id];
        const activeContext = controller.teamDetails?.contexts.find(c => c.id === activeContextId);

        if (isComplexTeam && activeContext) {
            const teamContainerId = `team-container-${controller.id}`;
            const memberNodes: Node[] = [];

            // Sort assignments by role authority level (lower is higher)
            const sortedAssignments = [...activeContext.assignments].sort((a, b) => {
                const roleA = controller.teamDetails?.roles.find(r => r.id === a.roleId);
                const roleB = controller.teamDetails?.roles.find(r => r.id === b.roleId);

                const authorityA = roleA?.authorityLevel ?? 99;
                const authorityB = roleB?.authorityLevel ?? 99;

                return authorityA - authorityB;
            });

            sortedAssignments.forEach((assignment, index) => {
                const member = controller.teamDetails?.members.find(m => m.id === assignment.memberId);
                const role = controller.teamDetails?.roles.find(r => r.id === assignment.roleId);
                if (member && role) {
                    memberNodes.push({
                        id: `${controller.id}-${member.id}`,
                        type: 'custom',
                        position: { x: TEAM_CONTAINER_PADDING, y: TEAM_HEADER_HEIGHT + (index * (BASE_NODE_HEIGHT + 15)) },
                        data: {
                            label: member.name,
                            role: role.name,
                            rank: member.commandRank
                        },
                        style: { backgroundColor: '#fff', width: NODE_WIDTH, height: BASE_NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #333' },
                        parentNode: teamContainerId,
                        extent: 'parent',
                        draggable: false, // Make member nodes non-draggable
                    });
                }
            });

            nodes.push({
                id: teamContainerId,
                type: 'default',
                position: { x: 0, y: 0 },
                data: { label: <strong>{controller.name}</strong> },
                style: {
                    border: '2px dashed #555',
                    backgroundColor: 'rgba(200, 200, 200, 0.05)',
                    width: NODE_WIDTH + (TEAM_CONTAINER_PADDING * 2),
                    height: TEAM_HEADER_HEIGHT + (memberNodes.length * (BASE_NODE_HEIGHT + 15)) - 10 + TEAM_CONTAINER_PADDING
                },
            });

            nodes.push(...memberNodes);
        } else {
            // STANDARD CONTROLLER NODE
            nodes.push({
                id: controller.id, type: 'custom', position: { x: 0, y: 0 }, data: { label: controller.name },
                style: { backgroundColor: CONTROLLER_TYPE_FILL_COLORS[controller.ctrlType], width: NODE_WIDTH, height: BASE_NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000' },
            });
        }
    });

    systemComponents.forEach(component => {
        nodes.push({ id: component.id, type: 'default', position: { x: 0, y: 0 }, data: { label: component.name }, style: { width: NODE_WIDTH, height: BASE_NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000', backgroundColor: '#fff' } });
    });

    controlPaths.forEach(path => {
        const sourceController = controllers.find(c => c.id === path.sourceControllerId);
        const associatedActions = controlActions.filter(ca => ca.controlPathId === path.id);

        if (sourceController?.ctrlType === ControllerType.Team && !sourceController.teamDetails?.isSingleUnit && activeContexts?.[sourceController.id]) {
            const activeContext = sourceController.teamDetails?.contexts.find(c => c.id === activeContexts[sourceController.id]);
            if (!activeContext) return;

            const actionsByRole = new Map<string, ControlAction[]>();
            associatedActions.forEach(action => {
                const roleId = action.roleId || 'unassigned';
                if (!actionsByRole.has(roleId)) actionsByRole.set(roleId, []);
                actionsByRole.get(roleId)!.push(action);
            });

            actionsByRole.forEach((actions, roleId) => {
                const memberAssignment = activeContext.assignments.find(a => a.roleId === roleId);
                const memberId = memberAssignment?.memberId;
                if(memberId) {
                    edges.push({ id: `cp-${path.id}-${roleId}`, source: `${sourceController.id}-${memberId}`, target: path.targetId, type: 'custom', label: actions.map(a => a.verb).join(', '), markerEnd: { type: 'arrowclosed', color: '#000' }, style: { stroke: '#000' } });
                }
            });
        } else {
            edges.push({ id: `cp-${path.id}`, source: path.sourceControllerId, target: path.targetId, type: 'custom', label: path.controls, markerEnd: { type: 'arrowclosed', color: '#000' }, style: { stroke: '#000' } });
        }
    });

    feedbackPaths.forEach(path => edges.push({ id: `fp-${path.id}`, source: path.sourceId, target: path.targetControllerId, type: 'custom', label: path.feedback, markerEnd: { type: 'arrowclosed', color: '#000' }, style: { stroke: '#16a34a' }, animated: !path.isMissing }));

    communicationPaths.forEach(path => {
        if(path.sourceMemberId && path.targetMemberId && path.sourceControllerId === path.targetControllerId) {
            edges.push({
                id: path.id, source: `${path.sourceControllerId}-${path.sourceMemberId}`, target: `${path.targetControllerId}-${path.targetMemberId}`, type: 'custom', label: path.description,
                style: { stroke: '#5a5a5a', strokeDasharray: '5 5' }, markerEnd: { type: 'arrowclosed', color: '#5a5a5a' }
            });
        } else {
            edges.push({ id: path.id, source: path.sourceControllerId, target: path.targetControllerId, type: 'custom', label: path.description, style: { stroke: '#888', strokeDasharray: '5 5' } });
        }
    });

    return { nodes, edges };
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 150, ranksep: 100, align: 'UL' });

    const topLevelNodes = nodes.filter(n => !n.parentNode);

    topLevelNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: node.style?.width || NODE_WIDTH, height: node.style?.height || BASE_NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Set parent for nested nodes
    nodes.forEach(node => {
        if(node.parentNode) {
            dagreGraph.setParent(node.id, node.parentNode);
        }
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition) {
            node.position = {
                x: nodeWithPosition.x - (node.style?.width || NODE_WIDTH) / 2,
                y: nodeWithPosition.y - (node.style?.height || BASE_NODE_HEIGHT) / 2,
            };
        }
        return node;
    });

    return { nodes: layoutedNodes, edges };
};

const GraphCanvas: React.FC = () => {
    const analysisData = useAnalysis();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    const memoizedTransformedData = useMemo(() => transformAnalysisData(analysisData), [analysisData, analysisData.activeContexts]);

    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(memoizedTransformedData.nodes, memoizedTransformedData.edges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        window.setTimeout(() => fitView({ duration: 500, padding: 0.1 }), 50);
    }, [memoizedTransformedData, setNodes, setEdges, fitView]);

    useEffect(() => {
        onLayout();
    }, [memoizedTransformedData.nodes.length, memoizedTransformedData.edges.length, onLayout]);

    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
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