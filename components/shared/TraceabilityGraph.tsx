import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Loss, 
  Hazard, 
  UnsafeControlAction, 
  UCCA, 
  Requirement 
} from '@/types';
import { TraceabilityGraph as TraceabilityGraphType } from '@/utils/stateManagement';
import { RiskScore } from '@/utils/riskScoring';
import { 
  MagnifyingGlassPlusIcon, 
  MagnifyingGlassMinusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import Select from './Select';

interface TraceabilityGraphProps {
  graph: TraceabilityGraphType;
  losses: Loss[];
  hazards: Hazard[];
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  requirements: Requirement[];
  riskScores?: Map<string, RiskScore>;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
  highlightedNodeId?: string;
  filterOptions?: {
    showLosses?: boolean;
    showHazards?: boolean;
    showUCAs?: boolean;
    showUCCAs?: boolean;
    showRequirements?: boolean;
    minLinkStrength?: number;
    onlyHighRisk?: boolean;
  };
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'loss' | 'hazard' | 'uca' | 'ucca' | 'requirement';
  label: string;
  code: string;
  riskCategory?: string;
  riskScore?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  type: string;
}

const TraceabilityGraph: React.FC<TraceabilityGraphProps> = ({
  graph,
  losses,
  hazards,
  ucas,
  uccas,
  requirements,
  riskScores,
  onNodeClick,
  highlightedNodeId,
  filterOptions = {
    showLosses: true,
    showHazards: true,
    showUCAs: true,
    showUCCAs: true,
    showRequirements: true,
    minLinkStrength: 0,
    onlyHighRisk: false
  }
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedLayout, setSelectedLayout] = useState<'force' | 'hierarchical' | 'radial'>('force');
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: Math.max(600, height) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Build graph data
  const buildGraphData = useCallback((): { nodes: GraphNode[], links: GraphLink[] } => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add nodes based on filter options
    if (filterOptions.showLosses) {
      losses.forEach(loss => {
        nodes.push({
          id: loss.id,
          type: 'loss',
          label: loss.title,
          code: loss.code
        });
      });
    }

    if (filterOptions.showHazards) {
      hazards.forEach(hazard => {
        nodes.push({
          id: hazard.id,
          type: 'hazard',
          label: hazard.title,
          code: hazard.code
        });
      });
    }

    if (filterOptions.showUCAs) {
      ucas.forEach(uca => {
        const risk = riskScores?.get(uca.id);
        if (!filterOptions.onlyHighRisk || (risk && ['Critical', 'High'].includes(risk.category))) {
          nodes.push({
            id: uca.id,
            type: 'uca',
            label: `${uca.code}: ${uca.context}`,
            code: uca.code,
            riskCategory: risk?.category,
            riskScore: risk?.overall
          });
        }
      });
    }

    if (filterOptions.showUCCAs) {
      uccas.forEach(ucca => {
        const risk = riskScores?.get(ucca.id);
        if (!filterOptions.onlyHighRisk || (risk && ['Critical', 'High'].includes(risk.category))) {
          nodes.push({
            id: ucca.id,
            type: 'ucca',
            label: `${ucca.code}: ${ucca.description}`,
            code: ucca.code,
            riskCategory: risk?.category,
            riskScore: risk?.overall
          });
        }
      });
    }


    if (filterOptions.showRequirements) {
      requirements.forEach(req => {
        nodes.push({
          id: req.id,
          type: 'requirement',
          label: req.text.substring(0, 50) + '...',
          code: `REQ-${req.id.substring(0, 4)}`
        });
      });
    }

    // Add links from graph
    graph.links.forEach(link => {
      if (link.strength >= (filterOptions.minLinkStrength || 0)) {
        const sourceNode = nodes.find(n => n.id === link.sourceId);
        const targetNode = nodes.find(n => n.id === link.targetId);
        
        if (sourceNode && targetNode) {
          links.push({
            source: link.sourceId,
            target: link.targetId,
            strength: link.strength,
            type: `${link.sourceType}-${link.targetType}`
          });
        }
      }
    });

    return { nodes, links };
  }, [graph, losses, hazards, ucas, uccas, requirements, riskScores, filterOptions]);

  // Initialize and update D3 visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, links } = buildGraphData();
    if (nodes.length === 0) return;

    // Create container groups
    const g = svg.append('g').attr('class', 'graph-container');
    
    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Create arrow markers for directed edges
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');

    // Create force simulation
    const newSimulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => 100 - (d.strength * 50))
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(30));

    setSimulation(newSimulation);

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => 0.3 + (d.strength * 0.7))
      .attr('stroke-width', d => 1 + (d.strength * 2))
      .attr('marker-end', 'url(#arrowhead)');

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => {
        if (d.type === 'loss') return 20;
        if (d.type === 'requirement') return 15;
        return 18;
      })
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => d.id === highlightedNodeId ? '#3b82f6' : '#fff')
      .attr('stroke-width', d => d.id === highlightedNodeId ? 4 : 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d.id, d.type);
      });

    // Add labels
    node.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(d => d.code);

    // Add tooltips
    node.append('title')
      .text(d => d.label);

    // Update positions on simulation tick
    newSimulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Apply layout if not force-directed
    if (selectedLayout === 'hierarchical') {
      applyHierarchicalLayout(nodes, links, dimensions);
    } else if (selectedLayout === 'radial') {
      applyRadialLayout(nodes, links, dimensions);
    }

    return () => {
      newSimulation.stop();
    };
  }, [buildGraphData, dimensions, onNodeClick, highlightedNodeId, selectedLayout]);

  // Helper function to get node color based on type and risk
  const getNodeColor = (node: GraphNode): string => {
    const baseColors = {
      loss: '#dc2626',      // red-600
      hazard: '#f59e0b',    // amber-500
      uca: '#3b82f6',       // blue-500
      ucca: '#8b5cf6',      // violet-500
      requirement: '#6366f1' // indigo-500
    };

    if (node.riskCategory) {
      const riskColors = {
        'Critical': '#991b1b',  // red-800
        'High': '#dc2626',      // red-600
        'Medium': '#f59e0b',    // amber-500
        'Low': '#10b981',       // emerald-500
        'Minimal': '#6ee7b7'    // emerald-300
      };
      return riskColors[node.riskCategory as keyof typeof riskColors] || baseColors[node.type];
    }

    return baseColors[node.type];
  };

  // Layout algorithms
  const applyHierarchicalLayout = (nodes: GraphNode[], _links: GraphLink[], dimensions: { width: number, height: number }) => {
    const levels: { [key: string]: GraphNode[] } = {
      loss: [],
      hazard: [],
      uca: [],
      ucca: [],
      requirement: []
    };

    nodes.forEach(node => {
      levels[node.type].push(node);
    });

    const levelOrder = ['loss', 'hazard', 'uca', 'ucca', 'requirement'];
    const levelHeight = dimensions.height / (levelOrder.length + 1);

    levelOrder.forEach((level, levelIndex) => {
      const nodesInLevel = levels[level];
      const levelWidth = dimensions.width / (nodesInLevel.length + 1);
      
      nodesInLevel.forEach((node, nodeIndex) => {
        node.fx = levelWidth * (nodeIndex + 1);
        node.fy = levelHeight * (levelIndex + 1);
      });
    });
  };

  const applyRadialLayout = (nodes: GraphNode[], _links: GraphLink[], dimensions: { width: number, height: number }) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    const typeGroups: { [key: string]: GraphNode[] } = {};
    nodes.forEach(node => {
      if (!typeGroups[node.type]) typeGroups[node.type] = [];
      typeGroups[node.type].push(node);
    });

    const types = Object.keys(typeGroups);
    const angleStep = (2 * Math.PI) / types.length;

    types.forEach((type, typeIndex) => {
      const typeAngle = angleStep * typeIndex;
      const nodesOfType = typeGroups[type];
      const nodeAngleStep = angleStep / nodesOfType.length;

      nodesOfType.forEach((node, nodeIndex) => {
        const angle = typeAngle + (nodeAngleStep * nodeIndex);
        node.fx = centerX + radius * Math.cos(angle);
        node.fy = centerY + radius * Math.sin(angle);
      });
    });
  };

  // Control functions
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleTo as any,
      zoomLevel * 1.2
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleTo as any,
      zoomLevel * 0.8
    );
  };

  const handleResetView = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  const handleLayoutChange = (layout: 'force' | 'hierarchical' | 'radial') => {
    setSelectedLayout(layout);
    if (simulation) {
      if (layout === 'force') {
        simulation.nodes().forEach(node => {
          node.fx = null;
          node.fy = null;
        });
        simulation.alpha(1).restart();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[600px] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 space-y-2">
          <div className="flex gap-1">
            <Button
              onClick={handleZoomIn}
              variant="secondary"
              size="sm"
              title="Zoom In"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleZoomOut}
              variant="secondary"
              size="sm"
              title="Zoom Out"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleResetView}
              variant="secondary"
              size="sm"
              title="Reset View"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
          </div>
          <Select
            value={selectedLayout}
            onChange={(e) => handleLayoutChange(e.target.value as any)}
            options={[
              { value: 'force', label: 'Force Layout' },
              { value: 'hierarchical', label: 'Hierarchical' },
              { value: 'radial', label: 'Radial' }
            ]}
            className="w-32"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            {filterOptions.showLosses && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-slate-600 dark:text-slate-300">Loss</span>
              </div>
            )}
            {filterOptions.showHazards && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-slate-600 dark:text-slate-300">Hazard</span>
              </div>
            )}
            {filterOptions.showUCAs && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-slate-600 dark:text-slate-300">UCA</span>
              </div>
            )}
            {filterOptions.showUCCAs && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <span className="text-slate-600 dark:text-slate-300">UCCA</span>
              </div>
            )}
            {filterOptions.showRequirements && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-600 dark:text-slate-300">Requirement</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
};

export default TraceabilityGraph;