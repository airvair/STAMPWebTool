import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, useNodesState, useEdgesState, Panel, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import { CustomEdge, CustomNode } from './CustomGraphElements';
import { Controller, SystemComponent, ControlPath, FeedbackPath, CommunicationPath, ControllerType } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';

// A simple icon for our layout button
const LayoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" > <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /> </svg> );

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

const getControllerColor = (ctrlType: ControllerType): string => {
    const CONTROLLER_TYPE_FILL_COLORS: Record<ControllerType, string> = {
        [ControllerType.Software]: '#d1e7dd',
        [ControllerType.Human]: '#cff4fc',
        [ControllerType.Team]: '#fff3cd',
        [ControllerType.Organisation]: '#f8d7da',
    };
    return CONTROLLER_TYPE_FILL_COLORS[ctrlType];
};

const transformAnalysisData = (
    controllers: Controller[],
    systemComponents: SystemComponent[],
    controlPaths: ControlPath[],
    feedbackPaths: FeedbackPath[],
    communicationPaths: CommunicationPath[]
): { initialNodes: Node[], initialEdges: Edge[] } => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    controllers.forEach(controller => {
        initialNodes.push({
            id: controller.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: { label: controller.name },
            style: { backgroundColor: getControllerColor(controller.ctrlType), width: NODE_WIDTH, height: NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000' },
        });
    });

    systemComponents.forEach(component => {
        initialNodes.push({
            id: component.id,
            type: 'custom',
            position: { x: 0, y: 0 },
            data: { label: component.name },
            style: { backgroundColor: '#FFFFFF', width: NODE_WIDTH, height: NODE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #000' },
        });
    });

    controlPaths.forEach(path => {
        initialEdges.push({
            id: `cp-${path.id}`,
            source: path.sourceControllerId,
            target: path.targetId,
            type: 'custom',
            label: path.controls,
            sourceHandle: 'bottom_left',
            targetHandle: 'top_left',
            markerEnd: { type: 'arrowclosed', color: '#000000', width: 20, height: 20 },
            style: { stroke: '#000000' },
        });
    });

    feedbackPaths.forEach(path => {
        initialEdges.push({
            id: `fp-${path.id}`,
            source: path.sourceId,
            target: path.targetControllerId,
            type: 'custom',
            label: path.feedback,
            sourceHandle: 'top_right',
            targetHandle: 'bottom_right',
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
            type: 'default', // Using a default edge type for simplicity
            label: path.description,
            style: {
                stroke: '#888888',
                strokeDasharray: '5, 5',
            },
            markerStart: { type: 'arrowclosed', color: '#888888', width: 15, height: 15 },
            markerEnd: { type: 'arrowclosed', color: '#888888', width: 15, height: 15 },
        });
    });

    return { initialNodes, initialEdges };
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Increase node and rank separation to prevent label overlap
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 270, // Increased horizontal separation
        ranksep: 150  // Increased vertical separation
    });

    nodes.forEach((node) => dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));

    edges.forEach((edge) => {
        // Only use hierarchical edges for layouting to prevent cycles
        if (edge.id.startsWith('cp-') || edge.id.startsWith('fp-')) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    return {
        nodes: nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            // Only update positions for nodes that were part of the layout
            if (nodeWithPosition) {
                return {
                    ...node,
                    position: {
                        x: nodeWithPosition.x - NODE_WIDTH / 2,
                        y: nodeWithPosition.y - NODE_HEIGHT / 2,
                    },
                };
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

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { fitView } = useReactFlow();

    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
        setNodes(layoutedNodes);
        window.setTimeout(() => fitView({ duration: 500 }), 50);
    }, [nodes, edges, setNodes, fitView]);

    useEffect(() => {
        // This effect syncs the graph with the context state, preserving positions
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const updatedNodes = initialNodes.map(node => ({
            ...node,
            position: nodeMap.get(node.id)?.position || { x: 0, y: 0 }
        }));
        setNodes(updatedNodes);
        setEdges(initialEdges);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes, initialEdges]);

    useEffect(() => {
        onLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
    const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

    if (!analysisData) { return <div>Loading...</div>; }

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