import { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import { NODE_WIDTH, BASE_NODE_HEIGHT } from '@/constants';

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
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