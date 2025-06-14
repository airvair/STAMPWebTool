import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, useNodesState, useEdgesState, Panel, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { CustomEdge, CustomNode } from './CustomGraphElements';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath, ControllerType } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';
import { CONTROLLER_TYPE_FILL_COLORS } from '../../constants';

const LayoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" > <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /> </svg> );

const NODE_WIDTH = 180;
const BASE_NODE_HEIGHT = 60;
const HANDLE_V_SPACING = 25; // Min vertical pixels per handle

const transformAnalysisData = (
    controllers: Controller[],
    systemComponents: SystemComponent[],
    controlPaths: ControlPath[],
    feedbackPaths: FeedbackPath[],
    communicationPaths: CommunicationPath[]
): { initialNodes: Node[], initialEdges: Edge[] } => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const allNodeIds = controllers.map(c => c.id);

    const commConnections: { [nodeId: string]: number } = {};
    allNodeIds.forEach(id => { commConnections[id] = 0 });

    communicationPaths.forEach(p => {
        if (commConnections[p.sourceControllerId] !== undefined) commConnections[p.sourceControllerId]++;
        if (commConnections[p.targetControllerId] !== undefined) commConnections[p.targetControllerId]++;
    });

    controllers.forEach(controller => {
        const commCount = commConnections[controller.id] || 0;
        const dynamicHeight = Math.max(BASE_NODE_HEIGHT, commCount * HANDLE_V_SPACING);

        initialNodes.push({
            id: controller.id, type: 'custom', position: { x: 0, y: 0 },
            data: { label: controller.name, commCount },
            style: {
                // UPDATED: Using centralized color from constants
                backgroundColor: CONTROLLER_TYPE_FILL_COLORS[controller.ctrlType],
                width: NODE_WIDTH, height: dynamicHeight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000',
                willChange: 'transform'
            },
        });
    });

    systemComponents.forEach(component => {
        initialNodes.push({
            id: component.id, type: 'custom', position: { x: 0, y: 0 }, data: { label: component.name, commCount: 0 },
            style: {
                backgroundColor: '#FFFFFF', width: NODE_WIDTH, height: BASE_NODE_HEIGHT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000',
                willChange: 'transform'
            },
        });
    });

    controlPaths.forEach(path => {
        initialEdges.push({
            id: `cp-${path.id}`, source: path.sourceControllerId, target: path.targetId, type: 'custom',
            label: path.controls, sourceHandle: 'bottom_left', targetHandle: 'top_left',
            markerEnd: { type: 'arrowclosed', color: '#000000', width: 20, height: 20 },
            style: { stroke: '#000000' },
        });
    });

    feedbackPaths.forEach(path => {
        initialEdges.push({
            id: `fp-${path.id}`, source: path.sourceId, target: path.targetControllerId, type: 'custom',
            label: path.feedback, sourceHandle: 'top_right', targetHandle: 'bottom_right',
            markerEnd: { type: 'arrowclosed', color: path.isMissing ? '#FF0000' : '#000000', width: 20, height: 20 },
            animated: !path.isMissing,
            style: path.isMissing ? { stroke: '#FF0000', strokeDasharray: '5 5' } : { stroke: '#000000' },
        });
    });

    communicationPaths.forEach(path => {
        initialEdges.push({
            id: `comm-${path.id}`,
            source: path.sourceControllerId,
            target: path.targetControllerId,
            type: 'smoothstep',
            label: path.description,
            style: { stroke: '#888888', strokeDasharray: '5, 5' },
        });
    });


    return { initialNodes, initialEdges };
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 270, ranksep: 150 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: (node.style?.width as number) || NODE_WIDTH,
            height: (node.style?.height as number) || BASE_NODE_HEIGHT
        });
    });

    edges.forEach((edge) => {
        if (edge.id.startsWith('cp-') || edge.id.startsWith('fp-')) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    return {
        nodes: nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            if (nodeWithPosition) {
                return { ...node, position: { x: nodeWithPosition.x - ((node.style?.width as number) || NODE_WIDTH) / 2, y: nodeWithPosition.y - ((node.style?.height as number) || BASE_NODE_HEIGHT) / 2 } };
            }
            return node;
        }),
        edges,
    };
};

const GraphCanvas: React.FC = () => {
    const analysisData = useAnalysis();
    const { initialNodes, initialEdges } = useMemo(() => transformAnalysisData(
        analysisData.controllers, analysisData.systemComponents, analysisData.controlPaths, analysisData.feedbackPaths, analysisData.communicationPaths
    ), [analysisData]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [_, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes } = getLayoutedElements(nodes, initialEdges);
        setNodes(layoutedNodes);
        window.setTimeout(() => fitView({ duration: 500 }), 50);
    }, [nodes, initialEdges, setNodes, fitView]);

    useEffect(() => {
        const { nodes: layoutedNodes, edges: laidOutEdges } = getLayoutedElements(initialNodes, initialEdges);
        setNodes(layoutedNodes);
        setEdges(laidOutEdges);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes.length, initialEdges.length]);

    const dynamicEdges = useMemo(() => {
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        const handleUsageCount: { [nodeId: string]: { left: number; right: number } } = {};
        nodes.forEach(n => { handleUsageCount[n.id] = { left: 0, right: 0 }; });

        return initialEdges.map(edge => {
            if (edge.id.startsWith('comm-')) {
                const sourceNode = nodeMap.get(edge.source);
                const targetNode = nodeMap.get(edge.target);

                if (sourceNode && targetNode) {
                    const sourceX = sourceNode.position.x + ((sourceNode.style?.width as number || NODE_WIDTH) / 2);
                    const targetX = targetNode.position.x + ((targetNode.style?.width as number || NODE_WIDTH) / 2);

                    let sourceHandleId: string;
                    let targetHandleId: string;

                    if (targetX > sourceX) {
                        const sourceIndex = handleUsageCount[edge.source].right++;
                        const targetIndex = handleUsageCount[edge.target].left++;
                        sourceHandleId = `comm_right_S_${sourceIndex}`;
                        targetHandleId = `comm_left_T_${targetIndex}`;
                    } else {
                        const sourceIndex = handleUsageCount[edge.source].left++;
                        const targetIndex = handleUsageCount[edge.target].right++;
                        sourceHandleId = `comm_left_S_${sourceIndex}`;
                        targetHandleId = `comm_right_T_${targetIndex}`;
                    }

                    return { ...edge, sourceHandle: sourceHandleId, targetHandle: targetHandleId };
                }
            }
            return edge;
        });
    }, [nodes, initialEdges]);


    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
    const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

    if (!analysisData) { return <div>Loading...</div>; }

    return (
        <ReactFlow
            nodes={nodes}
            edges={dynamicEdges}
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