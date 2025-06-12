import React from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { ControllerType } from '../../types';
import {
  CONTROLLER_TYPE_COLORS,
  CONTROL_LINE_COLOR,
  FEEDBACK_LINE_COLOR,
  MISSING_LINE_COLOR,
  CONTROLLER_TYPE_FILL_COLORS,
} from '../../constants';
import * as dagre from 'dagre';

interface Position { x: number; y: number; }
interface DiagramProps { svgRef?: React.Ref<SVGSVGElement>; }

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const MARGIN = 40;

const ControlStructureDiagram: React.FC<DiagramProps> = ({ svgRef }) => {
  const { systemComponents, controllers, controlPaths, feedbackPaths } = useAnalysis();

  // Build graph using dagre for automatic layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  controllers.forEach(c => {
    g.setNode(c.id, { width: NODE_WIDTH, height: NODE_HEIGHT, label: c.name, type: 'controller', ctrlType: c.ctrlType });
  });

  systemComponents.forEach(sc => {
    g.setNode(sc.id, { width: NODE_WIDTH, height: NODE_HEIGHT, label: sc.name, type: 'component' });
  });

  controlPaths.forEach(cp => {
    g.setEdge(cp.sourceControllerId, cp.targetId, {
      id: cp.id,
      type: 'control',
      label: cp.actuatorLabel || 'actuator',
    });
  });

  feedbackPaths.forEach(fp => {
    g.setEdge(fp.sourceId, fp.targetControllerId, {
      id: fp.id,
      type: 'feedback',
      label: fp.sensorLabel || 'sensor',
      missing: fp.isMissing,
      indirect: fp.indirect,
    });
  });

  dagre.layout(g);

  const graphInfo = g.graph();
  const svgWidth = (graphInfo.width || 0) + MARGIN * 2;
  const svgHeight = (graphInfo.height || 0) + MARGIN * 2;

  const positions: Record<string, Position> = {};
  g.nodes().forEach(id => {
    const n = g.node(id) as any;
    positions[id] = { x: (n.x as number) + MARGIN, y: (n.y as number) + MARGIN };
  });

  const edges = g.edges().map(e => {
    const edgeData = g.edge(e) as any;
    const points = (edgeData.points as { x: number; y: number }[]).map(p => ({ x: p.x + MARGIN, y: p.y + MARGIN }));
    return { ...edgeData, points, source: e.v, target: e.w };
  });

  return (
    <svg ref={svgRef} width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>\
      <defs>
        <marker id="arrow-control" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={CONTROL_LINE_COLOR} />
        </marker>
        <marker id="arrow-feedback" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={FEEDBACK_LINE_COLOR} />
        </marker>
        <marker id="arrow-missing" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={MISSING_LINE_COLOR} />
        </marker>
      </defs>

      {/* Draw edges */}
      {edges.map(edge => {
        const points = edge.points as { x: number; y: number }[];
        if (!points || points.length === 0) return null;
        const path = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
        const mid = points[Math.floor(points.length / 2)];
        const isControl = edge.type === 'control';
        const stroke = isControl ? CONTROL_LINE_COLOR : (edge.missing ? MISSING_LINE_COLOR : FEEDBACK_LINE_COLOR);
        const dash = !isControl && edge.missing ? '4 2' : undefined;
        const marker = isControl ? 'url(#arrow-control)' : (edge.missing ? 'url(#arrow-missing)' : 'url(#arrow-feedback)');
        return (
          <g key={edge.id}>
            <path d={path} fill="none" stroke={stroke} strokeDasharray={dash} markerEnd={marker} />
            <text x={mid.x} y={mid.y - 4} textAnchor="middle" fontSize="10">
              {edge.label}
              {edge.indirect ? ' (indirect)' : ''}
              {edge.missing ? ' MISSING' : ''}
            </text>
          </g>
        );
      })}

      {/* Draw nodes */}
      {controllers.map(ctrl => {
        const pos = positions[ctrl.id];
        if (!pos) return null;
        const classes = CONTROLLER_TYPE_COLORS[ctrl.ctrlType];
        const fill = CONTROLLER_TYPE_FILL_COLORS[ctrl.ctrlType];
        return (
          <g key={ctrl.id}>
            <rect x={pos.x - NODE_WIDTH/2} y={pos.y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} className={classes} fill={fill} stroke="black" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{ctrl.name}</text>
          </g>
        );
      })}

      {systemComponents.map(comp => {
        const pos = positions[comp.id];
        if (!pos) return null;
        return (
          <g key={comp.id}>
            <rect x={pos.x - NODE_WIDTH/2} y={pos.y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} fill="white" stroke="black" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{comp.name}</text>
          </g>
        );
      })}

    </svg>
  );
};

export default ControlStructureDiagram;

