import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { NODE_WIDTH, BASE_NODE_HEIGHT, CHILD_NODE_SPACING } from '@/utils/constants';

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
        rankdir: direction, 
        nodesep: CHILD_NODE_SPACING * 2, // More horizontal separation to allow vertical alignment
        ranksep: 150, // Generous vertical space
        align: 'DL', // Down-Left alignment for better hierarchical layout
        marginx: 40,
        marginy: 20,
        edgesep: 20, // More edge separation
        acyclicer: 'greedy'
    });

    nodes.forEach((node) => {
        // Use the calculated width from node data if available, otherwise fall back to style width or default
        const nodeWidth = node.data?.width || (node.style?.width as number) || NODE_WIDTH;
        const nodeHeight = (node.style?.height as number) || BASE_NODE_HEIGHT;
        
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        if(node.parentNode) {
            dagreGraph.setParent(node.id, node.parentNode);
        }
    });

    // Only add control path edges to Dagre for layout calculation
    // Feedback paths should not influence the hierarchical layout
    edges.forEach((edge) => {
        if (edge.id.startsWith('cp-')) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
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

    // Second pass: Strict vertical alignment based on control paths
    // Build a hierarchy map to understand parent-child relationships
    // IMPORTANT: Only use control paths (cp-) for layout, not feedback paths (fp-)
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();
    
    edges.forEach(edge => {
        // Only consider control paths for layout hierarchy
        if (edge.id.startsWith('cp-')) {
            // Build children map
            if (!childrenMap.has(edge.source)) {
                childrenMap.set(edge.source, []);
            }
            childrenMap.get(edge.source)!.push(edge.target);
            
            // Build parents map
            if (!parentsMap.has(edge.target)) {
                parentsMap.set(edge.target, []);
            }
            parentsMap.get(edge.target)!.push(edge.source);
        }
    });

    // Sort nodes by rank (y-position) to process from top to bottom
    const nodesByRank = [...nodes].sort((a, b) => a.position.y - b.position.y);
    
    // Group nodes by approximate rank
    const rankGroups: Node[][] = [];
    let currentRank: Node[] = [];
    let currentY = -Infinity;
    
    nodesByRank.forEach(node => {
        if (node.position.y - currentY > 50) {
            if (currentRank.length > 0) {
                rankGroups.push(currentRank);
            }
            currentRank = [node];
            currentY = node.position.y;
        } else {
            currentRank.push(node);
        }
    });
    if (currentRank.length > 0) {
        rankGroups.push(currentRank);
    }

    // Process each rank group to align nodes vertically with their connections
    rankGroups.forEach((rank, rankIndex) => {
        if (rankIndex === 0) return; // Skip top rank
        
        // For each node in this rank, try to align it with its parents
        rank.forEach(node => {
            const parents = parentsMap.get(node.id) || [];
            if (parents.length === 0) return;
            
            const nodeWidth = node.data?.width || (node.style?.width as number) || NODE_WIDTH;
            
            if (parents.length === 1) {
                // Single parent - align directly under parent
                const parent = nodes.find(n => n.id === parents[0]);
                if (parent) {
                    const parentWidth = parent.data?.width || (parent.style?.width as number) || NODE_WIDTH;
                    const parentCenterX = parent.position.x + parentWidth / 2;
                    
                    // Check if this parent has multiple children
                    const siblings = childrenMap.get(parent.id) || [];
                    const siblingIndex = siblings.indexOf(node.id);
                    
                    if (siblings.length > 1 && siblingIndex !== -1) {
                        // Multiple children - position based on index
                        const totalChildrenWidth = siblings.length * NODE_WIDTH + (siblings.length - 1) * CHILD_NODE_SPACING;
                        const startX = parentCenterX - totalChildrenWidth / 2;
                        node.position.x = startX + siblingIndex * (NODE_WIDTH + CHILD_NODE_SPACING);
                    } else {
                        // Single child - center under parent
                        node.position.x = parentCenterX - nodeWidth / 2;
                    }
                }
            } else {
                // Multiple parents - center under all parents
                let minParentX = Infinity;
                let maxParentX = -Infinity;
                
                parents.forEach(parentId => {
                    const parent = nodes.find(n => n.id === parentId);
                    if (parent) {
                        const parentWidth = parent.data?.width || (parent.style?.width as number) || NODE_WIDTH;
                        minParentX = Math.min(minParentX, parent.position.x);
                        maxParentX = Math.max(maxParentX, parent.position.x + parentWidth);
                    }
                });
                
                if (minParentX !== Infinity) {
                    const centerX = (minParentX + maxParentX) / 2;
                    node.position.x = centerX - nodeWidth / 2;
                }
            }
        });
        
        // After positioning, check for overlaps within the rank and separate if needed
        rank.sort((a, b) => a.position.x - b.position.x);
        
        for (let i = 1; i < rank.length; i++) {
            const prevNode = rank[i - 1];
            const currNode = rank[i];
            const prevWidth = prevNode.data?.width || (prevNode.style?.width as number) || NODE_WIDTH;
            
            const prevRight = prevNode.position.x + prevWidth;
            const minGap = CHILD_NODE_SPACING;
            
            if (currNode.position.x < prevRight + minGap) {
                currNode.position.x = prevRight + minGap;
            }
        }
    });

    // Third pass: Handle special case - when siblings converge to same node
    // This prevents crossing by ensuring proper ordering
    rankGroups.forEach((rank, rankIndex) => {
        if (rankIndex === rankGroups.length - 1) return; // Skip last rank
        
        
        // For each pair of nodes in current rank
        for (let i = 0; i < rank.length - 1; i++) {
            for (let j = i + 1; j < rank.length; j++) {
                const nodeA = rank[i];
                const nodeB = rank[j];
                
                // Get children of both nodes
                const childrenA = childrenMap.get(nodeA.id) || [];
                const childrenB = childrenMap.get(nodeB.id) || [];
                
                // Find common children (convergence points)
                const commonChildren = childrenA.filter(childId => childrenB.includes(childId));
                
                if (commonChildren.length > 0) {
                    // These siblings share children - ensure they don't cross
                    // The leftmost parent should connect to the leftmost position on the child
                    // This is already handled by the handle positioning in dataTransformation.ts
                    // But we can ensure nodes are positioned to minimize crossing
                    
                    // If nodeA is to the left of nodeB, ensure their connections maintain this order
                    if (nodeA.position.x < nodeB.position.x) {
                        // Check each common child
                        commonChildren.forEach(childId => {
                            const child = nodes.find(n => n.id === childId);
                            if (child) {
                                // Ensure child is positioned to allow non-crossing connections
                                const childWidth = child.data?.width || (child.style?.width as number) || NODE_WIDTH;
                                const nodeBWidth = nodeB.data?.width || (nodeB.style?.width as number) || NODE_WIDTH;
                                
                                // The child should be positioned between the two parents
                                const minX = nodeA.position.x;
                                const maxX = nodeB.position.x + nodeBWidth;
                                const idealX = (minX + maxX) / 2 - childWidth / 2;
                                
                                // Only adjust if it improves alignment
                                const currentOffset = Math.abs(child.position.x - idealX);
                                if (currentOffset > NODE_WIDTH / 4) {
                                    child.position.x = idealX;
                                }
                            }
                        });
                    }
                }
            }
        }
    });

    return { nodes, edges };
};