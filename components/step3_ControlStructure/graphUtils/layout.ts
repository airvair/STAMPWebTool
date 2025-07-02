import { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import { NODE_WIDTH, BASE_NODE_HEIGHT, CHILD_NODE_SPACING } from '@/constants';

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 0, ranksep: 100, align: 'UL' });

    nodes.forEach((node) => {
        // Use the calculated width from node data if available, otherwise fall back to style width or default
        const nodeWidth = node.data?.width || (node.style?.width as number) || NODE_WIDTH;
        const nodeHeight = (node.style?.height as number) || BASE_NODE_HEIGHT;
        
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        if(node.parentNode) {
            dagreGraph.setParent(node.id, node.parentNode);
        }
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    // Create a map to track parent-child relationships from edges
    const parentChildMap = new Map<string, string[]>();
    edges.forEach((edge) => {
        const children = parentChildMap.get(edge.source) || [];
        if (!children.includes(edge.target)) {
            children.push(edge.target);
        }
        parentChildMap.set(edge.source, children);
    });

    // First pass: position all nodes using Dagre's layout
    nodes.forEach((node) => {
        if (!node.parentNode) {
            const nodeWithPosition = dagreGraph.node(node.id);
            if (nodeWithPosition) {
                const nodeWidth = node.data?.width || (node.style?.width as number) || NODE_WIDTH;
                const nodeHeight = (node.style?.height as number) || BASE_NODE_HEIGHT;
                
                node.position = {
                    x: nodeWithPosition.x - (nodeWidth / 2),
                    y: nodeWithPosition.y - (nodeHeight / 2),
                };
            }
        }
    });

    // Second pass: align parents with their children
    nodes.forEach((parentNode) => {
        const children = parentChildMap.get(parentNode.id);
        if (children && children.length > 0) {
            // Find child nodes
            const childNodes = nodes.filter(n => children.includes(n.id));
            if (childNodes.length > 0) {
                // Sort children by x position to find leftmost
                childNodes.sort((a, b) => a.position.x - b.position.x);
                
                // Align parent's left edge with leftmost child's left edge
                const leftmostChild = childNodes[0];
                parentNode.position.x = leftmostChild.position.x;
                
                // Position children to be adjacent to each other under the parent with spacing
                let currentX = leftmostChild.position.x;
                childNodes.forEach((child, index) => {
                    child.position.x = currentX;
                    const childWidth = child.data?.width || (child.style?.width as number) || NODE_WIDTH;
                    currentX += childWidth;
                    // Add spacing between children (except after the last child)
                    if (index < childNodes.length - 1) {
                        currentX += CHILD_NODE_SPACING;
                    }
                });
            }
        }
    });

    return { nodes, edges };
};