// airvair/stampwebtool/STAMPWebTool-b000546fa5f298b66d61c62bd2d61ff4ceb6cfb3/components/step3_ControlStructure/ControlStructureGraph.tsx
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
const NODE_SEPARATION = 80; // Horizontal separation between nodes on the same rank
const RANK_SEPARATION = 120; // Vertical separation between ranks (layers)

interface TransformedData {
    nodes: Node[];
    edges: Edge[];
}

const transformAnalysisData = (
    analysisData: ReturnType<typeof useAnalysis>
): TransformedData => {
    const { controllers, systemComponents, controlPaths, feedbackPaths, communicationPaths } = analysisData;
    let nodes: Node[] = [];
    let edges: Edge[] = [];

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

        // Parent node width must account for its children's widths plus the separation between them.
        const nodeWidth = numChildren > 1
            ? (NODE_WIDTH * numChildren) + (NODE_SEPARATION * (numChildren - 1))
            : NODE_WIDTH;

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


const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: NODE_SEPARATION, ranksep: RANK_SEPARATION });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: node.data.width || NODE_WIDTH, height: BASE_NODE_HEIGHT });
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
                    x: nodeWithPosition.x - (node.data.width || NODE_WIDTH) / 2,
                    y: nodeWithPosition.y - BASE_NODE_HEIGHT / 2,
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