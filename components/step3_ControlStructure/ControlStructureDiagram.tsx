import React, { useEffect, useState } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { ControllerType } from '../../types';
import { CONTROLLER_TYPE_COLORS, CONTROL_LINE_COLOR, FEEDBACK_LINE_COLOR, MISSING_LINE_COLOR } from '../../constants';
import { layoutControlStructure } from '../../utils/layout';

interface Position { x: number; y: number; }
interface DiagramProps { svgRef?: React.Ref<SVGSVGElement>; }

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const LEVEL_HEIGHT = 120;
const SVG_WIDTH = 1000;

const ControlStructureDiagram: React.FC<DiagramProps> = ({ svgRef }) => {
  const { systemComponents, controllers, controlPaths, feedbackPaths } = useAnalysis();

  const [positions, setPositions] = useState<Record<string, Position>>({});

  useEffect(() => {
    layoutControlStructure(controllers, systemComponents, controlPaths, feedbackPaths)
      .then(res => setPositions(res.positions))
      .catch(() => setPositions({}));
  }, [controllers, systemComponents, controlPaths, feedbackPaths]);

  const maxY = Object.values(positions).reduce((m, p) => Math.max(m, p.y), 0);
  const svgHeight = maxY + LEVEL_HEIGHT;

  return (
    <svg ref={svgRef} width="100%" height={svgHeight} viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}>\
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

      {/* Draw lines for control paths */}
      {controlPaths.map(cp => {
        const src = positions[cp.sourceControllerId];
        const tgt = positions[cp.targetId];
        if (!src || !tgt) return null;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        return (
          <g key={cp.id}>
            <line
              x1={src.x}
              y1={src.y + NODE_HEIGHT / 2}
              x2={tgt.x}
              y2={tgt.y - NODE_HEIGHT / 2}
              stroke={CONTROL_LINE_COLOR}
              markerEnd="url(#arrow-control)"
            />
            <text x={midX} y={midY - 4} textAnchor="middle" fontSize="10">
              {cp.actuatorLabel || 'actuator'}
            </text>
          </g>
        );
      })}

      {/* Draw lines for feedback paths */}
      {feedbackPaths.map(fp => {
        const src = positions[fp.sourceId];
        const tgt = positions[fp.targetControllerId];
        if (!src || !tgt) return null;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const stroke = fp.isMissing ? MISSING_LINE_COLOR : FEEDBACK_LINE_COLOR;
        const dash = fp.isMissing ? '4 2' : undefined;
        const marker = fp.isMissing ? 'url(#arrow-missing)' : 'url(#arrow-feedback)';
        return (
          <g key={fp.id}>
            <line
              x1={src.x}
              y1={src.y - NODE_HEIGHT / 2}
              x2={tgt.x}
              y2={tgt.y + NODE_HEIGHT / 2}
              stroke={stroke}
              strokeDasharray={dash}
              markerEnd={marker}
            />
            <text x={midX} y={midY - 4} textAnchor="middle" fontSize="10">
              {fp.sensorLabel || 'sensor'}
              {fp.indirect ? ' (indirect)' : ''}
              {fp.isMissing ? ' MISSING' : ''}
            </text>
          </g>
        );
      })}

      {/* Draw nodes */}
      {controllers.map(ctrl => {
        const pos = positions[ctrl.id];
        if (!pos) return null;
        const classes = CONTROLLER_TYPE_COLORS[ctrl.ctrlType];
        return (
          <g key={ctrl.id}>
            <rect x={pos.x - NODE_WIDTH/2} y={pos.y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} className={classes} stroke="black" />
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

