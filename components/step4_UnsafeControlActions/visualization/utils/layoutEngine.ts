import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

export type LayoutType = 'hierarchical' | 'circular' | 'force' | 'grid';

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

const DAGRE_CONFIG = {
  rankdir: 'TB',
  align: 'DL',
  nodesep: 100,
  ranksep: 150,
  edgesep: 50,
  marginx: 50,
  marginy: 50,
};

const NODE_WIDTH = 250;
const NODE_HEIGHT = 120;

export const applyLayout = async (
  nodes: Node[],
  edges: Edge[],
  layoutType: LayoutType
): Promise<LayoutResult> => {
  switch (layoutType) {
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges);
    case 'circular':
      return applyCircularLayout(nodes, edges);
    case 'force':
      return applyForceLayout(nodes, edges);
    case 'grid':
      return applyGridLayout(nodes, edges);
    default:
      return { nodes, edges };
  }
};

const applyHierarchicalLayout = (nodes: Node[], edges: Edge[]): LayoutResult => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph(DAGRE_CONFIG);

  // Group nodes by type for hierarchical arrangement (unused but might be useful later)
  // const controllerNodes = nodes.filter(n => n.type === 'controller');
  // const ucaNodes = nodes.filter(n => n.type === 'uca');
  // const uccaNodes = nodes.filter(n => n.type === 'ucca');
  // const hazardNodes = nodes.filter(n => n.type === 'hazard');

  // Add nodes to graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const applyCircularLayout = (nodes: Node[], edges: Edge[]): LayoutResult => {
  const centerX = 500;
  const centerY = 500;
  const radius = 400;

  // Group nodes by type
  const nodeGroups = {
    controller: nodes.filter(n => n.type === 'controller'),
    uca: nodes.filter(n => n.type === 'uca'),
    ucca: nodes.filter(n => n.type === 'ucca'),
    hazard: nodes.filter(n => n.type === 'hazard'),
  };

  const layoutedNodes: Node[] = [];

  // Arrange each group in segments of the circle
  Object.entries(nodeGroups).forEach(([, groupNodes], groupIndex) => {
    const groupStartAngle = (groupIndex * 2 * Math.PI) / 4;
    const groupAngleSpan = (2 * Math.PI) / 4;

    groupNodes.forEach((node, index) => {
      const angle = groupStartAngle + (index * groupAngleSpan) / Math.max(groupNodes.length, 1);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      layoutedNodes.push({
        ...node,
        position: { x, y },
      });
    });
  });

  return { nodes: layoutedNodes, edges };
};

const applyForceLayout = (nodes: Node[], edges: Edge[]): LayoutResult => {
  // Simple force-directed layout simulation
  const iterations = 50;
  const k = Math.sqrt((1000 * 1000) / nodes.length); // Optimal distance
  const c = 0.1; // Cooling factor

  // Initialize positions randomly
  let positions = nodes.map(node => ({
    id: node.id,
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    vx: 0,
    vy: 0,
  }));

  // Create adjacency map
  const adjacencyMap = new Map<string, Set<string>>();
  edges.forEach(edge => {
    if (!adjacencyMap.has(edge.source)) adjacencyMap.set(edge.source, new Set());
    if (!adjacencyMap.has(edge.target)) adjacencyMap.set(edge.target, new Set());
    adjacencyMap.get(edge.source)!.add(edge.target);
    adjacencyMap.get(edge.target)!.add(edge.source);
  });

  // Simulate
  for (let iter = 0; iter < iterations; iter++) {
    const t = 1 - iter / iterations; // Temperature

    // Calculate repulsive forces
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const force = (k * k) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          positions[i].vx -= fx;
          positions[i].vy -= fy;
          positions[j].vx += fx;
          positions[j].vy += fy;
        }
      }
    }

    // Calculate attractive forces for edges
    edges.forEach(edge => {
      const sourcePos = positions.find(p => p.id === edge.source);
      const targetPos = positions.find(p => p.id === edge.target);
      
      if (sourcePos && targetPos) {
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const force = (dist * dist) / k;
          const fx = (dx / dist) * force * 0.1;
          const fy = (dy / dist) * force * 0.1;

          sourcePos.vx += fx;
          sourcePos.vy += fy;
          targetPos.vx -= fx;
          targetPos.vy -= fy;
        }
      }
    });

    // Update positions
    positions.forEach(pos => {
      pos.x += pos.vx * t * c;
      pos.y += pos.vy * t * c;
      pos.vx *= 0.85; // Damping
      pos.vy *= 0.85;

      // Keep within bounds
      pos.x = Math.max(50, Math.min(1500, pos.x));
      pos.y = Math.max(50, Math.min(1500, pos.y));
    });
  }

  // Apply positions to nodes
  const layoutedNodes = nodes.map(node => {
    const pos = positions.find(p => p.id === node.id)!;
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const applyGridLayout = (nodes: Node[], edges: Edge[]): LayoutResult => {
  const nodesByType = {
    controller: nodes.filter(n => n.type === 'controller'),
    uca: nodes.filter(n => n.type === 'uca'),
    ucca: nodes.filter(n => n.type === 'ucca'),
    hazard: nodes.filter(n => n.type === 'hazard'),
  };

  const layoutedNodes: Node[] = [];
  const startX = 50;
  const startY = 50;
  const columnWidth = 300;
  const rowHeight = 150;

  // Layout each type in its own column
  Object.entries(nodesByType).forEach(([, typeNodes], columnIndex) => {
    typeNodes.forEach((node, rowIndex) => {
      layoutedNodes.push({
        ...node,
        position: {
          x: startX + columnIndex * columnWidth,
          y: startY + rowIndex * rowHeight,
        },
      });
    });
  });

  return { nodes: layoutedNodes, edges };
};