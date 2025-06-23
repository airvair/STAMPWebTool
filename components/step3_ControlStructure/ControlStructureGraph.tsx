// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step3_ControlStructure/ControlStructureGraph.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, useNodesState, useEdgesState, Panel, useReactFlow, ReactFlowProvider, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { CustomEdge, CustomNode } from '@/components/step3_ControlStructure/CustomGraphElements';
import { Controller, SystemComponent, ControllerType, ControlPath, FeedbackPath, CommunicationPath } from '@/types';
import { useAnalysis } from '@/hooks/useAnalysis';
import { CONTROLLER_NODE_STYLE } from '@/constants';

const LayoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" > <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /> </svg> );

const NODE_WIDTH = 180;
const BASE_NODE_HEIGHT = 60;
const TEAM_CONTAINER_PADDING = 20;
const TEAM_HEADER_HEIGHT = 40;
const MEMBER_VERTICAL_SPACING = 20;

interface TransformedData {
    nodes: Node[];
    edges: Edge[];
}

const transformAnalysisData = (
    analysisData: ReturnType<typeof useAnalysis>
): TransformedData => {
    const { controllers, systemComponents, controlPaths, feedbackPaths, communicationPaths, activeContexts } = analysisData;
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    const getCommCount = (id: string) => communicationPaths.filter(p => p.sourceControllerId === id || p.targetControllerId === id).length;

    controllers.forEach(controller => {
        const isComplexTeam = controller.ctrlType === ControllerType.Team && !controller.teamDetails?.isSingleUnit;

        if (isComplexTeam && controller.teamDetails) {
            const teamContainerId = `team-container-${controller.id}`;
            const activeContext = controller.teamDetails?.contexts.find(c => c.id === activeContexts?.[controller.id]);

            const memberNodes: Node[] = [];

            if (activeContext) {
                const highestRank = (controller.teamDetails.members || []).map(m => m.commandRank).sort()[0];
                const sortedAssignments = [...activeContext.assignments].sort((a, b) => {
                    const roleA = controller.teamDetails?.roles.find(r => r.id === a.roleId);
                    const roleB = controller.teamDetails?.roles.find(r => r.id === b.roleId);
                    return (roleA?.authorityLevel ?? 99) - (roleB?.authorityLevel ?? 99);
                });

                sortedAssignments.forEach((assignment, index) => {
                    const member = controller.teamDetails?.members.find(m => m.id === assignment.memberId);
                    const role = controller.teamDetails?.roles.find(r => r.id === assignment.roleId);
                    if (member && role) {
                        const isCommander = member.commandRank === highestRank && member.commandRank !== 'GR';
                        memberNodes.push({
                            id: `${controller.id}-${member.id}`,
                            type: 'custom',
                            position: { x: TEAM_CONTAINER_PADDING, y: TEAM_HEADER_HEIGHT + (index * (BASE_NODE_HEIGHT + MEMBER_VERTICAL_SPACING)) },
                            data: { label: member.name, role: role.name, rank: member.commandRank, commCount: 0 },
                            parentNode: teamContainerId,
                            extent: 'parent',
                            draggable: false,
                            style: {
                                width: NODE_WIDTH,
                                height: BASE_NODE_HEIGHT,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: CONTROLLER_NODE_STYLE[controller.ctrlType].color,
                                borderStyle: 'solid',
                                borderRadius: '0.25rem',
                                // Conditional border for the commander
                                borderWidth: isCommander ? 2.5 : 1,
                                borderColor: isCommander ? '#DAA520' : CONTROLLER_NODE_STYLE[controller.ctrlType].borderColor,
                            }
                        });
                    }
                });
            }

            nodes.push({
                id: teamContainerId,
                type: 'default',
                position: { x: 0, y: 0 },
                data: { label: activeContext ? controller.name : `${controller.name} (Select Context)` },
                style: {
                    ...CONTROLLER_NODE_STYLE[ControllerType.Team],
                    width: NODE_WIDTH + (TEAM_CONTAINER_PADDING * 2),
                    height: TEAM_HEADER_HEIGHT + (memberNodes.length * (BASE_NODE_HEIGHT + MEMBER_VERTICAL_SPACING)) - (memberNodes.length > 0 ? MEMBER_VERTICAL_SPACING : 0) + TEAM_CONTAINER_PADDING,
                    borderRadius: '0.5rem',
                },
                zIndex: -1,
            });

            nodes.push(...memberNodes);

        } else {
            nodes.push({
                id: controller.id,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: { label: controller.name, commCount: getCommCount(controller.id) },
                style: {
                    ...CONTROLLER_NODE_STYLE[controller.ctrlType],
                    width: NODE_WIDTH,
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
        nodes.push({ id: component.id, type: 'custom', position: { x: 0, y: 0 }, data: { label: component.name, commCount: getCommCount(component.id) }, style: { width: NODE_WIDTH, height: BASE_NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000', backgroundColor: '#fff', color: '#000' } });
    });

    controlPaths.forEach(path => {
        edges.push({
            id: `cp-${path.id}`,
            source: path.sourceControllerId,
            target: path.targetId,
            type: 'custom',
            label: path.controls,
            markerEnd: { type: 'arrowclosed', color: '#FFFFFF' },
            style: { stroke: '#FFFFFF' },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
            sourceHandle: 'bottom_left',
            targetHandle: 'top_left'
        });
    });

    feedbackPaths.forEach(path => edges.push({ id: `fp-${path.id}`, source: path.sourceId, target: path.targetControllerId, type: 'custom', label: path.feedback, markerEnd: { type: 'arrowclosed', color: '#6ee7b7' }, style: { stroke: '#6ee7b7' }, animated: !path.isMissing, sourcePosition: Position.Top, targetPosition: Position.Bottom, sourceHandle: 'top_right', targetHandle: 'bottom_right' }));

    communicationPaths.forEach(path => {
        const sourceNode = path.sourceMemberId ? `${path.sourceControllerId}-${path.sourceMemberId}` : path.sourceControllerId;
        const targetNode = path.targetMemberId ? `${path.targetControllerId}-${path.targetMemberId}` : path.targetControllerId;
        edges.push({
            id: path.id,
            source: sourceNode,
            target: targetNode,
            type: 'custom',
            label: path.description,
            style: { stroke: '#888', strokeDasharray: '5 5' },
            sourcePosition: Position.Right,
            targetPosition: Position.Left
        });
    });

    return { nodes, edges };
};


const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 150, ranksep: 100, align: 'UL' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: (node.style?.width as number) || NODE_WIDTH, height: (node.style?.height as number) || BASE_NODE_HEIGHT });
        if(node.parentNode) {
            dagreGraph.setParent(node.id, node.parentNode);
        }
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        if (!node.parentNode) {
            const nodeWithPosition = dagreGraph.node(node.id);
            if (nodeWithPosition) {
                node.position = {
                    x: nodeWithPosition.x - ((node.style?.width as number || NODE_WIDTH) / 2),
                    y: nodeWithPosition.y - ((node.style?.height as number || BASE_NODE_HEIGHT) / 2),
                };
            }
        }
    });

    return { nodes, edges };
};

const GraphCanvas: React.FC = () => {
    const analysisData = useAnalysis();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    const memoizedTransformedData = useMemo(() => transformAnalysisData(analysisData), [
        analysisData.controllers,
        analysisData.systemComponents,
        analysisData.controlPaths,
        analysisData.feedbackPaths,
        analysisData.communicationPaths,
        analysisData.activeContexts
    ]);

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
            <Background color="#aaa" gap={16} />
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