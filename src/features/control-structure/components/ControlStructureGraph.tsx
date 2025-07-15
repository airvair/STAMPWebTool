import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomEdge } from '@/features/control-structure/components/graph/CustomEdge';
import { CustomNode } from '@/features/control-structure/components/graph/CustomNode';
import { TeamMemberNode } from '@/features/control-structure/components/graph/TeamMemberNode'; // Import the new node
import { useAnalysis } from '@/hooks/useAnalysis';
import { transformAnalysisData } from './graphUtils/dataTransformation';
import { getLayoutedElements } from './graphUtils/layout';
import VisualizationDock from './VisualizationDock';


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

    const nodeTypes = useMemo(() => ({
        custom: CustomNode,
        teamMember: TeamMemberNode // Register the new node type
    }), []);
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
            <VisualizationDock onLayout={onLayout} />
            <Background color="#aaa" gap={16} />
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
